from pathlib import Path
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = Field(default="production", validation_alias=AliasChoices("ENVIRONMENT", "APP_ENV"))
    port: int = Field(default=8001, validation_alias=AliasChoices("PORT", "APP_PORT"))
    storage_dir: str = "storage"
    video_sample_interval_seconds: float = 0.5
    video_heatmap_width: int = 96
    video_heatmap_height: int = 54

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def heatmap_dir(self) -> Path:
        path = Path(self.storage_dir).resolve() / "heatmaps"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def temp_video_dir(self) -> Path:
        path = Path(self.storage_dir).resolve() / "tmp"
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
