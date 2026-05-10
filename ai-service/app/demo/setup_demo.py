from __future__ import annotations

from app.db.postgres_repository import PostgresRepository
from app.db.seed_demo_database import seed_demo_database
from app.demo.generate_demo_environment import generate_demo_environment
from app.demo.match_intelligence_demo import build_match_recommendation
from app.demo.profile_generator import build_profiles
from app.ml.predict_demo import predict_batch
from app.ml.train_demo_model import train_demo_model
from app.utils.logger import log
from app.utils.settings import settings


def run_setup_demo() -> dict:
    repository = PostgresRepository(settings.demo_database_url)
    environment = generate_demo_environment(club_name=settings.demo_club_name)
    training_result = train_demo_model(settings.demo_model_file)

    latest_rows = (
        environment.training_dataframe()
        .sort_values(["athleteId", "recordedAt"])
        .groupby("athleteId", as_index=False)
        .tail(1)
        .reset_index(drop=True)
    )
    latest_scores = predict_batch(latest_rows, str(settings.demo_model_file))
    latest_load_map = {
        item["athlete_id"]: item
        for item in environment.daily_loads
        if item["recorded_at"] == max(
            row["recorded_at"]
            for row in environment.daily_loads
            if row["athlete_id"] == item["athlete_id"]
        )
    }
    profiles = build_profiles(environment.athletes, latest_scores, list(latest_load_map.values()))
    match_recommendation = build_match_recommendation(
        environment.athletes,
        profiles,
        latest_scores,
        environment.matches[-1],
    )
    seed_result = seed_demo_database(repository, environment, profiles, latest_scores, match_recommendation)

    result = {
        "clubName": settings.demo_club_name,
        "seed": seed_result,
        "training": training_result,
        "modelPath": str(settings.demo_model_file),
    }
    log("info", "demo.setup.completed", **result)
    return result


if __name__ == "__main__":
    run_setup_demo()
