import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Template
import logging
from ..core.email_config import email_settings

logger = logging.getLogger(__name__)

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=email_settings.MAIL_USERNAME,
    MAIL_PASSWORD=email_settings.MAIL_PASSWORD,
    MAIL_FROM=email_settings.MAIL_FROM,
    MAIL_PORT=email_settings.MAIL_PORT,
    MAIL_SERVER=email_settings.MAIL_SERVER,
    MAIL_STARTTLS=email_settings.MAIL_TLS,
    MAIL_SSL_TLS=email_settings.MAIL_SSL,
    USE_CREDENTIALS=email_settings.USE_CREDENTIALS,
    VALIDATE_CERTS=email_settings.VALIDATE_CERTS
)

fastmail = FastMail(conf)

def generate_verification_token() -> str:
    """Generate a secure verification token."""
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    """Generate a secure password reset token."""
    return secrets.token_urlsafe(32)

async def send_verification_email(email: str, token: str, name: str = "사용자"):
    """Send email verification email."""
    try:
        message = MessageSchema(
            subject="NONGBUX 이메일 인증",
            recipients=[email],
            body=f"""
안녕하세요, {name}님!

NONGBUX에 회원가입해 주셔서 감사합니다.

아래 링크를 클릭하여 이메일 인증을 완료해 주세요:
http://localhost:3000/verify-email?token={token}

이 링크는 24시간 동안 유효합니다.

본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.

감사합니다.
NONGBUX 팀
            """,
            subtype="plain"
        )
        
        await fastmail.send_message(message)
        logger.info(f"Verification email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        # 실제 이메일 발송이 실패해도 개발 환경에서는 계속 진행
        logger.info(f"Development mode: Verification token for {email}: {token}")
        return False

async def send_password_reset_email(email: str, token: str, name: str = "사용자"):
    """Send password reset email."""
    try:
        message = MessageSchema(
            subject="NONGBUX 비밀번호 재설정",
            recipients=[email],
            body=f"""
안녕하세요, {name}님!

비밀번호 재설정을 요청하셨습니다.

아래 링크를 클릭하여 새 비밀번호를 설정해 주세요:
http://localhost:3000/reset-password?token={token}

이 링크는 1시간 동안 유효합니다.

본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.

감사합니다.
NONGBUX 팀
            """,
            subtype="plain"
        )
        
        await fastmail.send_message(message)
        logger.info(f"Password reset email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        logger.info(f"Development mode: Password reset token for {email}: {token}")
        return False

async def send_welcome_email(email: str, name: str = "사용자"):
    """Send welcome email."""
    try:
        message = MessageSchema(
            subject="NONGBUX에 오신 것을 환영합니다!",
            recipients=[email],
            body=f"""
안녕하세요, {name}님!

NONGBUX에 가입해 주셔서 감사합니다!

이제 다음 기능들을 사용하실 수 있습니다:
- 웹사이트 URL에서 콘텐츠 자동 추출
- 마크다운 형식으로 변환
- 추출된 콘텐츠 관리

저희 서비스를 통해 더 효율적으로 콘텐츠를 관리하세요!

즐거운 시간 보내세요!

NONGBUX 팀
            """,
            subtype="plain"
        )
        
        await fastmail.send_message(message)
        logger.info(f"Welcome email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return False 