from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8001
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
