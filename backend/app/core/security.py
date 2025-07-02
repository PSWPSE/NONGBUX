from datetime import datetime, timedelta
from typing import Any, Union

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import os

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# API 키 암호화 설정
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # 개발용 기본 키 (프로덕션에서는 반드시 환경변수로 설정)
    ENCRYPTION_KEY = base64.urlsafe_b64encode(b"default-encryption-key-32-bytes!").decode()

fernet = Fernet(ENCRYPTION_KEY.encode() if len(ENCRYPTION_KEY) == 44 else base64.urlsafe_b64encode(ENCRYPTION_KEY.encode()[:32]))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Union[str, None]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Union[str, None] = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

# API 키 암호화/복호화 함수
def encrypt_api_key(api_key: str) -> str:
    """API 키를 암호화합니다."""
    return fernet.encrypt(api_key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """암호화된 API 키를 복호화합니다."""
    return fernet.decrypt(encrypted_key.encode()).decode()

def mask_api_key(api_key: str) -> str:
    """API 키를 마스킹합니다. (sk-...****...abc 형태)"""
    if not api_key or len(api_key) < 10:
        return "****"
    
    if api_key.startswith("sk-"):
        # Claude API 키 형태: sk-ant-api03-...
        prefix = api_key[:10]  # sk-ant-api
        suffix = api_key[-4:]   # 마지막 4글자
        return f"{prefix}****{suffix}"
    else:
        # 일반적인 키 형태
        prefix = api_key[:6]
        suffix = api_key[-4:]
        return f"{prefix}****{suffix}" 