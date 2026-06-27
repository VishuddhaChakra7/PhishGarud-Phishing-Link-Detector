from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "PhishGarud"
    DEBUG: bool = True
    
    # SQLite local database URLs
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./phishgarud.db",
        validation_alias="DATABASE_URL"
    )
    
    DATABASE_URL_SYNC: str = Field(
        default="sqlite:///./phishgarud.db",
        validation_alias="DATABASE_URL_SYNC"
    )

    # Config for loading .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
