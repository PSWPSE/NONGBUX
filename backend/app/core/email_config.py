from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class EmailSettings(BaseSettings):
    MAIL_USERNAME: str = "dummy@example.com"
    MAIL_PASSWORD: str = "dummy_password"
    MAIL_FROM: str = "dummy@example.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )

email_settings = EmailSettings() 