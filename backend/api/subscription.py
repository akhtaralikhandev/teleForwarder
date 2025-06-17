


from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models import User, Subscription
from app.schemas import SubscriptionResponse
from app.api.auth import get_current_user
from app.services.paypal_service import PayPalService
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found"
            )
        
        return SubscriptionResponse(
            id=subscription.id,
            paypal_subscription_id=subscription.paypal_subscription_id,
            status=subscription.status,
            amount=subscription.amount,
            currency=subscription.currency,
            next_billing_time=subscription.next_billing_time,
            created_at=subscription.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscription status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch subscription status"
        )

@router.post("/create")
async def create_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new PayPal subscription"""
    logger.info(f"Creating subscription for user {current_user.id}")
    
    # Check if user already has an active subscription
    existing_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_(["ACTIVE", "PENDING"])
    ).first()
    
    if existing_subscription:
        logger.warning(f"User {current_user.id} already has an active subscription")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription"
        )
    
    try:
        paypal_service = PayPalService()
        
        # Create PayPal subscription
        subscription_data = await paypal_service.create_subscription(current_user.id)
        
        # Store subscription in database
        subscription = Subscription(
            user_id=current_user.id,
            paypal_subscription_id=subscription_data["id"],
            status="PENDING",
            amount=9.99,  # Premium plan price
            currency="USD"
        )
        
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        logger.info(f"Subscription created successfully for user {current_user.id}")
        
        return {
            "subscription_id": subscription_data["id"],
            "status": subscription_data["status"],
            "approval_url": subscription_data["approval_url"],
            "message": "Subscription created successfully. Please complete the payment."
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating subscription for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    logger.info(f"Cancelling subscription for user {current_user.id}")
    
    # Get active subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "ACTIVE"
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    try:
        paypal_service = PayPalService()
        
        # Cancel PayPal subscription
        success = await paypal_service.cancel_subscription(
            subscription.paypal_subscription_id,
            "User requested cancellation"
        )
        
        if success:
            # Update subscription status
            subscription.status = "CANCELLED"
            current_user.subscription_active = False
            
            db.commit()
            
            logger.info(f"Subscription cancelled successfully for user {current_user.id}")
            
            return {"message": "Subscription cancelled successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription with PayPal"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error cancelling subscription for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )

@router.post("/webhook")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle PayPal webhook events"""
    try:
        body = await request.body()
        webhook_data = json.loads(body.decode('utf-8'))
        
        event_type = webhook_data.get("event_type")
        resource = webhook_data.get("resource", {})
        
        logger.info(f"Received PayPal webhook: {event_type}")
        
        # Verify webhook signature (implement in production)
        # paypal_service = PayPalService()
        # is_valid = await paypal_service.verify_webhook_signature(body, request.headers)
        # if not is_valid:
        #     raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            await handle_subscription_activated(resource, db)
            
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            await handle_subscription_cancelled(resource, db)
            
        elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
            await handle_subscription_suspended(resource, db)
            
        elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
            await handle_payment_failed(resource, db)
            
        elif event_type == "PAYMENT.SALE.COMPLETED":
            await handle_payment_completed(resource, db)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )

async def handle_subscription_activated(resource: Dict[str, Any], db: Session):
    """Handle subscription activation"""
    subscription_id = resource.get("id")
    
    subscription = db.query(Subscription).filter(
        Subscription.paypal_subscription_id == subscription_id
    ).first()
    
    if subscription:
        subscription.status = "ACTIVE"
        subscription.next_billing_time = resource.get("billing_info", {}).get("next_billing_time")
        
        # Activate user subscription
        user = db.query(User).filter(User.id == subscription.user_id).first()
        if user:
            user.subscription_active = True
        
        db.commit()
        logger.info(f"Subscription {subscription_id} activated")

async def handle_subscription_cancelled(resource: Dict[str, Any], db: Session):
    """Handle subscription cancellation"""
    subscription_id = resource.get("id")
    
    subscription = db.query(Subscription).filter(
        Subscription.paypal_subscription_id == subscription_id
    ).first()
    
    if subscription:
        subscription.status = "CANCELLED"
        
        # Deactivate user subscription
        user = db.query(User).filter(User.id == subscription.user_id).first()
        if user:
            user.subscription_active = False
        
        db.commit()
        logger.info(f"Subscription {subscription_id} cancelled")

async def handle_subscription_suspended(resource: Dict[str, Any], db: Session):
    """Handle subscription suspension"""
    subscription_id = resource.get("id")
    
    subscription = db.query(Subscription).filter(
        Subscription.paypal_subscription_id == subscription_id
    ).first()
    
    if subscription:
        subscription.status = "SUSPENDED"
        
        # Deactivate user subscription
        user = db.query(User).filter(User.id == subscription.user_id).first()
        if user:
            user.subscription_active = False
        
        db.commit()
        logger.info(f"Subscription {subscription_id} suspended")

async def handle_payment_failed(resource: Dict[str, Any], db: Session):
    """Handle payment failure"""
    subscription_id = resource.get("billing_agreement_id")
    
    if subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.paypal_subscription_id == subscription_id
        ).first()
        
        if subscription:
            # Log payment failure but don't immediately deactivate
            logger.warning(f"Payment failed for subscription {subscription_id}")
            # You might want to implement retry logic or grace period

async def handle_payment_completed(resource: Dict[str, Any], db: Session):
    """Handle successful payment"""
    subscription_id = resource.get("billing_agreement_id")
    
    if subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.paypal_subscription_id == subscription_id
        ).first()
        
        if subscription:
            # Ensure subscription is active
            if subscription.status != "ACTIVE":
                subscription.status = "ACTIVE"
                
                user = db.query(User).filter(User.id == subscription.user_id).first()
                if user:
                    user.subscription_active = True
                
                db.commit()
            
            logger.info(f"Payment completed for subscription {subscription_id}")

@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "premium_monthly",
                "name": "Premium Monthly",
                "description": "Unlimited forwarding rules, private channels, priority support",
                "price": 9.99,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Unlimited forwarding rules",
                    "Private channel support",
                    "Advanced filtering options",
                    "Priority customer support",
                    "99.9% uptime guarantee"
                ]
            }
        ]
    }

@router.post("/retry-payment")
async def retry_payment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retry failed payment for subscription"""
    # Get user's subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_(["SUSPENDED", "PENDING"])
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found that requires payment retry"
        )
    
    try:
        paypal_service = PayPalService()
        
        # Get subscription details from PayPal
        subscription_details = await paypal_service.get_subscription_details(
            subscription.paypal_subscription_id
        )
        
        return {
            "subscription_id": subscription.paypal_subscription_id,
            "status": subscription_details.get("status"),
            "next_billing_time": subscription_details.get("billing_info", {}).get("next_billing_time"),
            "message": "Please update your payment method in PayPal to retry payment"
        }
        
    except Exception as e:
        logger.error(f"Error retrying payment for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry payment"
        )