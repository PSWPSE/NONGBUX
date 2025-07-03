from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다.')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('비밀번호에는 최소 하나의 영문자가 포함되어야 합니다.')
        if not re.search(r'\d', v):
            raise ValueError('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    profile_image: Optional[str] = None

class UserProfile(UserBase):
    id: int
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    profile_image: Optional[str] = None
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    login_count: int
    content_extraction_count: int
    last_content_extraction: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    api_key_active: bool
    api_key_verified_at: Optional[datetime] = None
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    email_verified: bool
    
    class Config:
        from_attributes = True

# Password management schemas
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다.')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('비밀번호에는 최소 하나의 영문자가 포함되어야 합니다.')
        if not re.search(r'\d', v):
            raise ValueError('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다.')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('비밀번호에는 최소 하나의 영문자가 포함되어야 합니다.')
        if not re.search(r'\d', v):
            raise ValueError('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.')
        return v

# Email verification
class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerification(BaseModel):
    token: str

class EmailVerificationStatus(BaseModel):
    email: EmailStr
    email_verified: bool
    registration_date: Optional[str] = None

# API Key schemas
class ApiKeySet(BaseModel):
    api_key: str

class ApiKeyVerify(BaseModel):
    api_key: str

class ApiKeyStatus(BaseModel):
    has_api_key: bool
    api_key_active: bool
    api_key_verified_at: Optional[datetime] = None
    masked_key: Optional[str] = None  # 마스킹된 키 (sk-...****...abc)

class ApiKeyTestResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None

# Content schemas
class ContentBase(BaseModel):
    url: str

class ContentCreate(ContentBase):
    pass

class Content(ContentBase):
    id: int
    original_content: Optional[Dict[str, Any]] = None
    converted_content: Optional[str] = None
    created_at: datetime
    user_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    word_count: Optional[int] = None
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Content processing schemas
class ExtractRequest(BaseModel):
    url: str

class ExtractResponse(BaseModel):
    success: bool
    original_content: Dict[str, Any]
    converted_content: str
    content_id: int

# System stats
class UserStats(BaseModel):
    total_users: int
    active_users: int
    total_extractions: int
    users_with_api_keys: int
