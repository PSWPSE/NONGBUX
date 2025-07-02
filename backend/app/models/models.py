from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 사용자 프로필 정보
    full_name = Column(String, nullable=True)
    display_name = Column(String, nullable=True) 
    profile_image = Column(String, nullable=True)  # URL 또는 파일 경로
    
    # 계정 상태
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    
    # 비밀번호 재설정
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # API 키 관련 필드
    anthropic_api_key = Column(Text, nullable=True)  # 암호화된 API 키
    api_key_active = Column(Boolean, default=False)  # API 키 활성화 상태
    api_key_verified_at = Column(DateTime, nullable=True)  # API 키 검증 시간
    
    # 사용 통계
    content_extraction_count = Column(Integer, default=0)
    last_content_extraction = Column(DateTime, nullable=True)
    
    contents = relationship("Content", back_populates="owner")

class Content(Base):
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    original_content = Column(JSON)
    converted_content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # 콘텐츠 메타데이터
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    word_count = Column(Integer, nullable=True)
    
    owner = relationship("User", back_populates="contents")
