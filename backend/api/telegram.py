
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, BotSession
from app.schemas import BotStatusResponse
from app.api.auth import get_current_user
from app.services.telegram_service import TelegramService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start-bot")
async def start_telegram_bot(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start the Telegram bot for message forwarding"""
    logger.info(f"Starting Telegram bot for user {current_user.id}")
    
    try:
        telegram_service = TelegramService()
        
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        if bot_session and bot_session.is_running:
            return {
                "message": "Bot is already running",
                "status": "running"
            }
        
        background_tasks.add_task(
            telegram_service.start_forwarding, 
            current_user.id
        )
        
        if not bot_session:
            bot_session = BotSession(
                user_id=current_user.id,
                is_running=True,
                is_authenticated=True
            )
            db.add(bot_session)
        else:
            bot_session.is_running = True
            bot_session.is_authenticated = True
        
        db.commit()
        
        logger.info(f"Telegram bot started successfully for user {current_user.id}")
        
        return {
            "message": "Telegram bot started successfully",
            "status": "starting"
        }
        
    except Exception as e:
        logger.error(f"Error starting Telegram bot for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start Telegram bot"
        )

@router.post("/stop-bot")
async def stop_telegram_bot(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop the Telegram bot"""
    logger.info(f"Stopping Telegram bot for user {current_user.id}")
    
    try:
        telegram_service = TelegramService()
        
       
        await telegram_service.stop_forwarding(current_user.id)
        
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        if bot_session:
            bot_session.is_running = False
            db.commit()
        
        logger.info(f"Telegram bot stopped successfully for user {current_user.id}")
        
        return {
            "message": "Telegram bot stopped successfully",
            "status": "stopped"
        }
        
    except Exception as e:
        logger.error(f"Error stopping Telegram bot for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop Telegram bot"
        )

@router.get("/bot-status", response_model=BotStatusResponse)
async def get_bot_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current bot status"""
    try:
        from app.models import ForwardingRule
        
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        active_rules_count = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id,
            ForwardingRule.is_active == True
        ).count()
        
        if not bot_session:
            return BotStatusResponse(
                running=False,
                authenticated=False,
                last_activity=None,
                active_rules=active_rules_count
            )
        
        return BotStatusResponse(
            running=bot_session.is_running,
            authenticated=bot_session.is_authenticated,
            last_activity=bot_session.last_activity,
            active_rules=active_rules_count
        )
        
    except Exception as e:
        logger.error(f"Error fetching bot status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch bot status"
        )

@router.post("/authenticate")
async def authenticate_telegram(
    phone_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Authenticate with Telegram using phone number"""
    logger.info(f"Authenticating Telegram for user {current_user.id}")
    
    try:
        telegram_service = TelegramService()
        
     
        client = await telegram_service.create_client(current_user.id, phone_number)
        
       
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        if not bot_session:
            bot_session = BotSession(
                user_id=current_user.id,
                phone_number=phone_number,
                is_authenticated=True,
                is_running=False
            )
            db.add(bot_session)
        else:
            bot_session.phone_number = phone_number
            bot_session.is_authenticated = True
        
        db.commit()
        
        logger.info(f"Telegram authentication successful for user {current_user.id}")
        
        return {
            "message": "Telegram authentication successful",
            "authenticated": True
        }
        
    except Exception as e:
        logger.error(f"Error authenticating Telegram for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with Telegram"
        )

@router.get("/channels/available")
async def get_available_telegram_channels(
    current_user: User = Depends(get_current_user)
):
    """Get list of available Telegram channels for the user"""
    try:
        telegram_service = TelegramService()
        channels = await telegram_service.get_user_channels(current_user.id)
        
        return {
            "channels": channels,
            "count": len(channels)
        }
        
    except Exception as e:
        logger.error(f"Error fetching available channels for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch available channels"
        )