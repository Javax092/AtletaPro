from fastapi import APIRouter, Header, HTTPException, Request

from app.schemas.video import VideoProcessResponse
from app.services.video_service import video_analysis_service
from app.utils.logger import log

router = APIRouter(prefix="/api/video", tags=["video"])


@router.post("/process", response_model=VideoProcessResponse)
async def process_video(
    request: Request,
    x_club_id: str = Header(...),
    x_match_id: str = Header(...),
    x_file_name: str = Header("match-video.mp4"),
):
    file_bytes = await request.body()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Video payload is required")

    log(
        "info",
        "video.process.request",
        clubId=x_club_id,
        matchId=x_match_id,
        fileName=x_file_name,
        payloadBytes=len(file_bytes),
    )

    try:
        result = video_analysis_service.process_video(
            club_id=x_club_id,
            match_id=x_match_id,
            filename=x_file_name,
            file_bytes=file_bytes,
        )
        log(
            "info",
            "video.process.completed",
            clubId=x_club_id,
            matchId=x_match_id,
            status=result["status"],
            sampledFrames=result["sampledFrames"],
            durationSeconds=result["durationSeconds"],
        )
        return result
    except ValueError as error:
        log(
            "warn",
            "video.process.invalid",
            clubId=x_club_id,
            matchId=x_match_id,
            message=str(error),
        )
        raise HTTPException(status_code=400, detail=str(error)) from error
