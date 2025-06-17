# app/api/forwarding_rules.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User, ForwardingRule, TelegramChannel
from app.schemas import (
    ForwardingRuleCreate, 
    ForwardingRuleUpdate, 
    ForwardingRuleResponse,
    ForwardingLogResponse
)
from app.api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ForwardingRuleResponse])
async def get_forwarding_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = Query(False, description="Return only active rules")
):
    """Get all forwarding rules for the current user"""
    try:
        query = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id
        )
        
        if active_only:
            query = query.filter(ForwardingRule.is_active == True)
        
        rules = query.order_by(ForwardingRule.created_at.desc()).all()
        
        return [
            ForwardingRuleResponse(
                id=rule.id,
                source_channel_id=rule.source_channel_id,
                target_channel_id=rule.target_channel_id,
                filter_keywords=rule.filter_keywords,
                exclude_keywords=rule.exclude_keywords,
                is_active=rule.is_active,
                messages_forwarded=rule.messages_forwarded,
                last_forwarded_at=rule.last_forwarded_at,
                created_at=rule.created_at,
                updated_at=rule.updated_at
            ) for rule in rules
        ]
        
    except Exception as e:
        logger.error(f"Error fetching forwarding rules for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch forwarding rules"
        )

@router.post("/", response_model=ForwardingRuleResponse)
async def create_forwarding_rule(
    rule_data: ForwardingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new forwarding rule"""
    logger.info(f"Creating forwarding rule for user {current_user.id}")
    
    # Check subscription limits
    if not current_user.subscription_active:
        existing_rules_count = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id
        ).count()
        
        if existing_rules_count >= 3:  # Free tier limit
            logger.warning(f"User {current_user.id} exceeded free tier limit for forwarding rules")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free tier allows maximum 3 forwarding rules. Upgrade to premium for unlimited rules."
            )
    
    # Validate that source and target channels exist and belong to user
    source_channel = db.query(TelegramChannel).filter(
        TelegramChannel.user_id == current_user.id,
        TelegramChannel.channel_id == rule_data.source_channel_id,
        TelegramChannel.is_active == True
    ).first()
    
    if not source_channel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source channel not found or not accessible"
        )
    
    target_channel = db.query(TelegramChannel).filter(
        TelegramChannel.user_id == current_user.id,
        TelegramChannel.channel_id == rule_data.target_channel_id,
        TelegramChannel.is_active == True
    ).first()
    
    if not target_channel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target channel not found or not accessible"
        )
    
    # Check for duplicate rules
    existing_rule = db.query(ForwardingRule).filter(
        ForwardingRule.user_id == current_user.id,
        ForwardingRule.source_channel_id == rule_data.source_channel_id,
        ForwardingRule.target_channel_id == rule_data.target_channel_id
    ).first()
    
    if existing_rule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forwarding rule between these channels already exists"
        )
    
    try:
        # Create new forwarding rule
        rule = ForwardingRule(
            user_id=current_user.id,
            source_channel_id=rule_data.source_channel_id,
            target_channel_id=rule_data.target_channel_id,
            filter_keywords=rule_data.filter_keywords,
            exclude_keywords=rule_data.exclude_keywords,
            is_active=rule_data.is_active
        )
        
        db.add(rule)
        db.commit()
        db.refresh(rule)
        
        logger.info(f"Forwarding rule {rule.id} created successfully for user {current_user.id}")
        
        return ForwardingRuleResponse(
            id=rule.id,
            source_channel_id=rule.source_channel_id,
            target_channel_id=rule.target_channel_id,
            filter_keywords=rule.filter_keywords,
            exclude_keywords=rule.exclude_keywords,
            is_active=rule.is_active,
            messages_forwarded=rule.messages_forwarded,
            last_forwarded_at=rule.last_forwarded_at,
            created_at=rule.created_at,
            updated_at=rule.updated_at
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating forwarding rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create forwarding rule"
        )

@router.get("/{rule_id}", response_model=ForwardingRuleResponse)
async def get_forwarding_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific forwarding rule"""
    rule = db.query(ForwardingRule).filter(
        ForwardingRule.id == rule_id,
        ForwardingRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forwarding rule not found"
        )
    
    return ForwardingRuleResponse(
        id=rule.id,
        source_channel_id=rule.source_channel_id,
        target_channel_id=rule.target_channel_id,
        filter_keywords=rule.filter_keywords,
        exclude_keywords=rule.exclude_keywords,
        is_active=rule.is_active,
        messages_forwarded=rule.messages_forwarded,
        last_forwarded_at=rule.last_forwarded_at,
        created_at=rule.created_at,
        updated_at=rule.updated_at
    )

@router.put("/{rule_id}", response_model=ForwardingRuleResponse)
async def update_forwarding_rule(
    rule_id: int,
    rule_data: ForwardingRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a forwarding rule"""
    rule = db.query(ForwardingRule).filter(
        ForwardingRule.id == rule_id,
        ForwardingRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forwarding rule not found"
        )
    
    try:
        # Update only provided fields
        update_data = rule_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(rule, field, value)
        
        db.commit()
        db.refresh(rule)
        
        logger.info(f"Forwarding rule {rule_id} updated successfully for user {current_user.id}")
        
        return ForwardingRuleResponse(
            id=rule.id,
            source_channel_id=rule.source_channel_id,
            target_channel_id=rule.target_channel_id,
            filter_keywords=rule.filter_keywords,
            exclude_keywords=rule.exclude_
        )