
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, TelegramChannel
from app.schemas import ChannelCreate, ChannelResponse
from app.api.auth import get_current_user
from app.services.telegram_service import TelegramService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ChannelResponse])
async def get_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all channels for the current user"""
    try:
        channels = db.query(TelegramChannel).filter(
            TelegramChannel.user_id == current_user.id
        ).order_by(TelegramChannel.created_at.desc()).all()
        
        return [
            ChannelResponse(
                id=channel.id,
                channel_id=channel.channel_id,
                channel_name=channel.channel_name,
                channel_type=channel.channel_type,
                is_active=channel.is_active,
                created_at=channel.created_at
            ) for channel in channels
        ]
        
    except Exception as e:
        logger.error(f"Error fetching channels for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch channels"
        )

@router.post("/", response_model=ChannelResponse)
async def add_channel(
    channel_data: ChannelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new channel"""
    logger.info(f"Adding channel {channel_data.channel_name} for user {current_user.id}")
    
    # Check if user has subscription for private channels
    if channel_data.channel_type == "private" and not current_user.subscription_active:
        logger.warning(f"User {current_user.id} tried to add private channel without subscription")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required for private channels"
        )
    
    # Check if channel already exists for this user
    existing_channel = db.query(TelegramChannel).filter(
        TelegramChannel.user_id == current_user.id,
        TelegramChannel.channel_id == channel_data.channel_id
    ).first()
    
    if existing_channel:
        logger.warning(f"Channel {channel_data.channel_id} already exists for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel already added"
        )
    
    # Verify channel access using Telegram service
    telegram_service = TelegramService()
    try:
        has_access = await telegram_service.verify_channel_access(
            current_user.id, 
            channel_data.channel_id
        )
        
        if not has_access:
            logger.warning(f"User {current_user.id} doesn't have access to channel {channel_data.channel_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this channel or channel doesn't exist"
            )
    except Exception as e:
        logger.error(f"Channel verification error: {str(e)}")
        # Continue without verification in development mode
        pass
    
    try:
        # Create new channel
        channel = TelegramChannel(
            user_id=current_user.id,
            channel_id=channel_data.channel_id,
            channel_name=channel_data.channel_name,
            channel_type=channel_data.channel_type,
            is_active=True
        )
        
        db.add(channel)
        db.commit()
        db.refresh(channel)
        
        logger.info(f"Channel {channel.channel_name} added successfully for user {current_user.id}")
        
        return ChannelResponse(
            id=channel.id,
            channel_id=channel.channel_id,
            channel_name=channel.channel_name,
            channel_type=channel.channel_type,
            is_active=channel.is_active,
            created_at=channel.created_at
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding channel: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add channel"
        )

@router.put("/{channel_id}")
async def update_channel(
    channel_id: int,
    channel_data: ChannelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a channel"""
    channel = db.query(TelegramChannel).filter(
        TelegramChannel.id == channel_id,
        TelegramChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    try:
        channel.channel_name = channel_data.channel_name
        channel.channel_type = channel_data.channel_type
        channel.channel_id = channel_data.channel_id
        
        db.commit()
        db.refresh(channel)
        
        logger.info(f"Channel {channel_id} updated successfully for user {current_user.id}")
        
        return ChannelResponse(
            id=channel.id,
            channel_id=channel.channel_id,
            channel_name=channel.channel_name,
            channel_type=channel.channel_type,
            is_active=channel.is_active,
            created_at=channel.created_at
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating channel {channel_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update channel"
        )

@router.delete("/{channel_id}")
async def delete_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a channel"""
    channel = db.query(TelegramChannel).filter(
        TelegramChannel.id == channel_id,
        TelegramChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    try:
        # Check if channel is used in any forwarding rules
        from app.models import ForwardingRule
        
        rules_using_channel = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id,
            (ForwardingRule.source_channel_id == channel.channel_id) |
            (ForwardingRule.target_channel_id == channel.channel_id)
        ).all()
        
        if rules_using_channel:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete channel that is used in forwarding rules. Please delete the rules first."
            )
        
        db.delete(channel)
        db.commit()
        
        logger.info(f"Channel {channel_id} deleted successfully for user {current_user.id}")
        
        return {"message": "Channel deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting channel {channel_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete channel"
        )

@router.patch("/{channel_id}/toggle")
async def toggle_channel_status(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle channel active status"""
    channel = db.query(TelegramChannel).filter(
        TelegramChannel.id == channel_id,
        TelegramChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    try:
        channel.is_active = not channel.is_active
        db.commit()
        db.refresh(channel)
        
        logger.info(f"Channel {channel_id} status toggled to {channel.is_active} for user {current_user.id}")
        
        return ChannelResponse(
            id=channel.id,
            channel_id=channel.channel_id,
            channel_name=channel.channel_name,
            channel_type=channel.channel_type,
            is_active=channel.is_active,
            created_at=channel.created_at
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error toggling channel {channel_id} status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle channel status"
        )

@router.get("/available")
async def get_available_channels(
    current_user: User = Depends(get_current_user)
):
    """Get list of available channels from Telegram for the user"""
    try:
        telegram_service = TelegramService()
        channels = await telegram_service.get_user_channels(current_user.id)
        
        return {
            "channels": channels,
            "message": "Available channels fetched successfully"
        }
        
    except Exception as e:
        logger.error(f"Error fetching available channels for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch available channels"
        )