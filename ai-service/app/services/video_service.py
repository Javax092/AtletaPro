from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

import cv2
import numpy as np

from app.utils.logger import log
from app.utils.settings import settings


class VideoAnalysisService:
    region_labels = (
        "top-left",
        "top-center",
        "top-right",
        "mid-left",
        "center",
        "mid-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
    )

    def process_video(self, club_id: str, match_id: str, filename: str, file_bytes: bytes) -> dict:
        video_path = self._persist_temp_video(file_bytes=file_bytes, filename=filename)
        log(
            "info",
            "video.process.temp_file_created",
            clubId=club_id,
            matchId=match_id,
            fileName=filename,
            tempPath=str(video_path),
        )

        try:
            return self._analyze_video(club_id=club_id, match_id=match_id, filename=filename, video_path=video_path)
        finally:
            video_path.unlink(missing_ok=True)

    def _persist_temp_video(self, file_bytes: bytes, filename: str) -> Path:
        suffix = Path(filename).suffix or ".mp4"

        with NamedTemporaryFile(delete=False, dir=settings.temp_video_dir, suffix=suffix) as handle:
            handle.write(file_bytes)
            return Path(handle.name)

    def _analyze_video(self, club_id: str, match_id: str, filename: str, video_path: Path) -> dict:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise ValueError("Unable to open the provided video")

        fps = capture.get(cv2.CAP_PROP_FPS) or 0
        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = fps if fps > 0 else 25.0
        sample_step = max(1, int(round(fps * settings.video_sample_interval_seconds)))
        duration_seconds = round(total_frames / fps, 2) if total_frames > 0 else 0.0

        accumulated_motion = np.zeros((settings.video_heatmap_height, settings.video_heatmap_width), dtype=np.float32)
        previous_gray = None
        sampled_frames = 0
        frame_index = 0

        try:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break

                if frame_index % sample_step != 0:
                    frame_index += 1
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, (9, 9), 0)

                if previous_gray is not None:
                    delta = cv2.absdiff(gray, previous_gray)
                    _, thresholded = cv2.threshold(delta, 22, 255, cv2.THRESH_BINARY)
                    resized = cv2.resize(
                        thresholded.astype(np.float32),
                        (settings.video_heatmap_width, settings.video_heatmap_height),
                        interpolation=cv2.INTER_AREA,
                    )
                    accumulated_motion += resized / 255.0

                previous_gray = gray
                sampled_frames += 1
                frame_index += 1
        finally:
            capture.release()

        if sampled_frames < 2:
            raise ValueError("Video is too short for movement analysis")

        heatmap_path = self._write_heatmap(club_id=club_id, match_id=match_id, motion_map=accumulated_motion)
        dominant_regions = self._calculate_region_activity(accumulated_motion)

        summary = (
            f"{sampled_frames} frames amostrados de '{filename}'. "
            f"Maior concentração de movimento em {dominant_regions[0]['region']} "
            f"e {dominant_regions[1]['region']}."
        )

        return {
            "club_id": club_id,
            "match_id": match_id,
            "status": "COMPLETED",
            "summary": summary,
            "heatmapPath": str(heatmap_path),
            "sampledFrames": sampled_frames,
            "totalFrames": total_frames,
            "durationSeconds": duration_seconds,
            "sampleIntervalSeconds": settings.video_sample_interval_seconds,
            "dominantRegions": dominant_regions,
        }

    def _write_heatmap(self, club_id: str, match_id: str, motion_map: np.ndarray) -> Path:
        normalized = cv2.normalize(motion_map, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        colored = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
        upscaled = cv2.resize(colored, (960, 540), interpolation=cv2.INTER_CUBIC)

        filename = f"{club_id}_{match_id}_{uuid4().hex[:8]}.png"
        destination = settings.heatmap_dir / filename
        cv2.imwrite(str(destination), upscaled)
        return destination

    def _calculate_region_activity(self, motion_map: np.ndarray) -> list[dict]:
        rows = np.array_split(motion_map, 3, axis=0)
        scored_regions: list[dict] = []

        label_index = 0
        for row in rows:
            columns = np.array_split(row, 3, axis=1)
            for region in columns:
                score = float(region.sum())
                scored_regions.append(
                    {
                        "region": self.region_labels[label_index],
                        "score": round(score, 2),
                    }
                )
                label_index += 1

        scored_regions.sort(key=lambda item: item["score"], reverse=True)
        return scored_regions[:3]


video_analysis_service = VideoAnalysisService()
