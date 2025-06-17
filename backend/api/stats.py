# app/api/stats.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, TelegramChannel, ForwardingRule, ForwardingLog, BotSession
from app.schemas import StatsResponse, ForwardingLogResponse
from app.api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=StatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive statistics for the current user"""
    try:
        # Get channel count
        total_channels = db.query(TelegramChannel).filter(
            TelegramChannel.user_id == current_user.id
        ).count()
        
        # Get rules count
        total_rules = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id
        ).count()
        
        active_rules = db.query(ForwardingRule).filter(
            ForwardingRule.user_id == current_user.id,
            ForwardingRule.is_active == True
        ).count()
        
        # Get total messages forwarded
        total_messages_forwarded = db.query(func.sum(ForwardingRule.messages_forwarded)).filter(
            ForwardingRule.user_id == current_user.id
        ).scalar() or 0
        
        # Get bot status
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        bot_running = bot_session.is_running if bot_session else False
        
        return StatsResponse(
            total_channels=total_channels,
            total_rules=total_rules,
            total_messages_forwarded=int(total_messages_forwarded),
            active_rules=active_rules,
            bot_running=bot_running,
            subscription_active=current_user.subscription_active
        )
        
    except Exception as e:
        logger.error(f"Error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user statistics"
        )

@router.get("/logs", response_model=List[ForwardingLogResponse])
async def get_forwarding_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    status_filter: str = Query(None, description="Filter by status (SUCCESS, FAILED, FILTERED)"),
    rule_id: int = Query(None, description="Filter by rule ID"),
    days: int = Query(7, ge=1, le=90, description="Number of days to look back")
):
    """Get forwarding logs with filtering and pagination"""
    try:
        offset = (page - 1) * limit
        
        # Base query
        query = db.query(ForwardingLog).filter(
            ForwardingLog.user_id == current_user.id
        )
        
        # Apply filters
        if status_filter:
            query = query.filter(ForwardingLog.status == status_filter)
        
        if rule_id:
            query = query.filter(ForwardingLog.rule_id == rule_id)
        
        # Date filter
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(ForwardingLog.created_at >= start_date)
        
        # Get logs with pagination
        logs = query.order_by(ForwardingLog.created_at.desc()).offset(offset).limit(limit).all()
        
        return [
            ForwardingLogResponse(
                id=log.id,
                rule_id=log.rule_id,
                source_message_id=log.source_message_id,
                target_message_id=log.target_message_id,
                status=log.status,
                error_message=log.error_message,
                created_at=log.created_at
            ) for log in logs
        ]
        
    except Exception as e:
        logger.error(f"Error fetching logs for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch forwarding logs"
        )

@router.get("/analytics")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365, description="Number of days for analytics")
):
    """Get detailed analytics for the user"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Messages forwarded per day
        daily_stats = db.query(
            func.date(ForwardingLog.created_at).label('date'),
            func.count(ForwardingLog.id).label('total_messages'),
            func.sum(func.case([(ForwardingLog.status == 'SUCCESS', 1)], else_=0)).label('successful'),
            func.sum(func.case([(ForwardingLog.status == 'FAILED', 1)], else_=0)).label('failed'),
            func.sum(func.case([(ForwardingLog.status == 'FILTERED', 1)], else_=0)).label('filtered')
        ).filter(
            ForwardingLog.user_id == current_user.id,
            ForwardingLog.created_at >= start_date
        ).group_by(func.date(ForwardingLog.created_at)).order_by(func.date(ForwardingLog.created_at)).all()
        
        # Top performing rules
        top_rules = db.query(
            ForwardingRule.id,
            ForwardingRule.source_channel_id,
            ForwardingRule.target_channel_id,
            ForwardingRule.messages_forwarded
        ).filter(
            ForwardingRule.user_id == current_user.id
        ).order_by(ForwardingRule.messages_forwarded.desc()).limit(10).all()
        
        # Error analysis
        error_stats = db.query(
            ForwardingLog.error_message,
            func.count(ForwardingLog.id).label('count')
        ).filter(
            ForwardingLog.user_id == current_user.id,
            ForwardingLog.status == 'FAILED',
            ForwardingLog.created_at >= start_date,
            ForwardingLog.error_message.isnot(None)
        ).group_by(ForwardingLog.error_message).order_by(func.count(ForwardingLog.id).desc()).limit(5).all()
        
        return {
            "daily_stats": [
                {
                    "date": stat.date.isoformat(),
                    "total_messages": stat.total_messages,
                    "successful": int(stat.successful or 0),
                    "failed": int(stat.failed or 0),
                    "filtered": int(stat.filtered or 0)
                } for stat in daily_stats
            ],
            "top_rules": [
                {
                    "rule_id": rule.id,
                    "source_channel": rule.source_channel_id,
                    "target_channel": rule.target_channel_id,
                    "messages_forwarded": rule.messages_forwarded
                } for rule in top_rules
            ],
            "common_errors": [
                {
                    "error": error.error_message,
                    "count": error.count
                } for error in error_stats
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )

@router.get("/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics"""
    try:
        # Recent performance (last 24 hours)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        recent_logs = db.query(ForwardingLog).filter(
            ForwardingLog.user_id == current_user.id,
            ForwardingLog.created_at >= last_24h
        ).all()
        
        total_recent = len(recent_logs)
        successful_recent = sum(1 for log in recent_logs if log.status == 'SUCCESS')
        failed_recent = sum(1 for log in recent_logs if log.status == 'FAILED')
        
        success_rate = (successful_recent / total_recent * 100) if total_recent > 0 else 0
        
        # Average processing time (mock data - would need actual timing in production)
        avg_processing_time = 1.2  # seconds
        
        # Bot uptime
        bot_session = db.query(BotSession).filter(
            BotSession.user_id == current_user.id
        ).first()
        
        uptime_hours = 0
        if bot_session and bot_session.last_activity:
            uptime_hours = (datetime.utcnow() - bot_session.last_activity).total_seconds() / 3600
        
        return {
            "success_rate": round(success_rate, 2),
            "total_messages_24h": total_recent,
            "successful_messages_24h": successful_recent,
            "failed_messages_24h": failed_recent,
            "avg_processing_time": avg_processing_time,
            "bot_uptime_hours": round(uptime_hours, 2),
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching performance metrics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch performance metrics"
        )

@router.delete("/logs/cleanup")
async def cleanup_old_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days_to_keep: int = Query(90, ge=7, le=365, description="Number of days of logs to keep")
):
    """Clean up old forwarding logs"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted_count = db.query(ForwardingLog).filter(
            ForwardingLog.user_id == current_user.id,
            ForwardingLog.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old logs for user {current_user.id}")
        
        return {
            "message": f"Successfully deleted {deleted_count} old log entries",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up logs for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup old logs"
        )