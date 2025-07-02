from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.auth import get_current_active_user
from ..models.models import User, Content
from ..schemas.schemas import UserProfile, UserStats

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile."""
    return current_user

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's usage statistics."""
    # 최근 30일 콘텐츠 추출 횟수
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_extractions = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.created_at >= thirty_days_ago
    ).count()
    
    # 총 콘텐츠 수
    total_contents = db.query(Content).filter(
        Content.user_id == current_user.id
    ).count()
    
    # 이번 주 추출 횟수
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_extractions = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.created_at >= week_ago
    ).count()
    
    # 오늘 추출 횟수
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_extractions = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.created_at >= today
    ).count()
    
    return {
        "user_id": current_user.id,
        "member_since": current_user.created_at,
        "total_extractions": total_contents,
        "recent_extractions_30d": recent_extractions,
        "recent_extractions_7d": week_extractions,
        "recent_extractions_today": today_extractions,
        "last_extraction": current_user.last_content_extraction,
        "api_key_active": current_user.api_key_active,
        "email_verified": current_user.email_verified,
        "login_count": current_user.login_count,
        "last_login": current_user.last_login
    }

@router.get("/activity")
async def get_user_activity(
    days: int = Query(30, ge=1, le=365, description="조회할 일수 (1-365)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's activity history."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    contents = db.query(Content).filter(
        Content.user_id == current_user.id,
        Content.created_at >= start_date
    ).order_by(Content.created_at.desc()).all()
    
    # 일별 활동 집계
    daily_activity = {}
    for content in contents:
        date_key = content.created_at.date().isoformat()
        if date_key not in daily_activity:
            daily_activity[date_key] = 0
        daily_activity[date_key] += 1
    
    return {
        "period_days": days,
        "total_extractions": len(contents),
        "daily_activity": daily_activity,
        "recent_contents": [
            {
                "id": content.id,
                "url": content.url,
                "title": content.title,
                "created_at": content.created_at,
                "word_count": content.word_count
            }
            for content in contents[:10]  # 최근 10개만
        ]
    }
