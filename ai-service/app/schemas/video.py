from pydantic import BaseModel


class RegionActivity(BaseModel):
    region: str
    score: float


class VideoProcessResponse(BaseModel):
    club_id: str
    match_id: str
    status: str
    summary: str
    heatmapPath: str
    sampledFrames: int
    totalFrames: int
    durationSeconds: float
    sampleIntervalSeconds: float
    dominantRegions: list[RegionActivity]
