from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
import hashlib

from ..core.database import get_db
from ..core.auth import authenticate_user, create_access_token, get_password_hash, get_user_by_email, get_current_active_user, verify_password
from ..models.models import User
from ..schemas.schemas import (
    Token, UserCreate, User as UserSchema, UserProfile, UserUpdate,
    PasswordChange, PasswordResetRequest, PasswordReset,
    EmailVerificationRequest, EmailVerification
)

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="이미 등록된 이메일입니다."
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        display_name=user.display_name or user.full_name or user.email.split('@')[0],
        is_active=True,
        email_verified=False,  # 이메일 인증 필요
        email_verification_token=verification_token,
        login_count=0,
        content_extraction_count=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # TODO: 이메일 인증 메일 발송 구현
    # send_verification_email(user.email, verification_token)
    
    return db_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 로그인 통계 업데이트
    user.last_login = datetime.utcnow()
    user.login_count += 1
    db.commit()
    
    access_token_expires = timedelta(days=30)  # 30일로 연장
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
    if user_update.profile_image is not None:
        current_user.profile_image = user_update.profile_image
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    # Verify current password
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="현재 비밀번호가 올바르지 않습니다."
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_change.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

@router.post("/request-password-reset")
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset."""
    user = get_user_by_email(db, email=request.email)
    if not user:
        # 보안상 사용자 존재 여부를 노출하지 않음
        return {"message": "비밀번호 재설정 이메일을 발송했습니다."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)  # 1시간 유효
    db.commit()
    
    # TODO: 비밀번호 재설정 이메일 발송 구현
    # send_password_reset_email(user.email, reset_token)
    
    return {"message": "비밀번호 재설정 이메일을 발송했습니다."}

@router.post("/reset-password")
async def reset_password(
    password_reset: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password with token."""
    user = db.query(User).filter(
        User.password_reset_token == password_reset.token,
        User.password_reset_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="유효하지 않거나 만료된 토큰입니다."
        )
    
    # Update password and clear reset token
    user.hashed_password = get_password_hash(password_reset.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "비밀번호가 성공적으로 재설정되었습니다."}

@router.post("/verify-email")
async def verify_email(
    verification: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify email with token."""
    user = db.query(User).filter(
        User.email_verification_token == verification.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="유효하지 않은 인증 토큰입니다."
        )
    
    user.email_verified = True
    user.email_verification_token = None
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "이메일이 성공적으로 인증되었습니다."}

@router.post("/resend-verification")
async def resend_verification_email(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Resend email verification."""
    user = get_user_by_email(db, email=request.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="사용자를 찾을 수 없습니다."
        )
    
    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="이미 인증된 이메일입니다."
        )
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    user.email_verification_token = verification_token
    db.commit()
    
    # TODO: 이메일 인증 메일 재발송 구현
    # send_verification_email(user.email, verification_token)
    
    return {"message": "인증 이메일을 재발송했습니다."}

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user account."""
    # 사용자의 모든 콘텐츠도 함께 삭제
    db.query(User).filter(User.id == current_user.id).delete()
    db.commit()
    
    return {"message": "계정이 성공적으로 삭제되었습니다."}
