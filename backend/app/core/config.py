from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Credentia API"
    database_url: str = "postgresql+psycopg://credentia:credentia@localhost:5432/credentia"
    secret_key: str = "change-me-in-development"
    access_token_expire_minutes: int = 60
    coingecko_api_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-flash-lite-latest"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"])

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")


settings = Settings()
