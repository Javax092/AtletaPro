from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Iterator

from psycopg import connect
from psycopg.rows import dict_row


DDL_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS athletes (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      current_status TEXT NOT NULL,
      current_team TEXT NOT NULL,
      birth_date DATE NOT NULL,
      age INTEGER NOT NULL,
      availability_status TEXT NOT NULL,
      demo_tag TEXT NOT NULL DEFAULT 'demo',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS athlete_daily_load (
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      recorded_at TIMESTAMPTZ NOT NULL,
      distance_meters DOUBLE PRECISION NOT NULL,
      sprint_count INTEGER NOT NULL,
      accel_count INTEGER NOT NULL,
      decel_count INTEGER NOT NULL,
      workload DOUBLE PRECISION NOT NULL,
      avg_heart_rate_bpm DOUBLE PRECISION NOT NULL,
      max_heart_rate_bpm DOUBLE PRECISION NOT NULL,
      session_minutes DOUBLE PRECISION NOT NULL,
      perceived_effort DOUBLE PRECISION NOT NULL,
      fatigue_level DOUBLE PRECISION NOT NULL,
      sleep_hours DOUBLE PRECISION NOT NULL,
      soreness_level DOUBLE PRECISION NOT NULL,
      injury_risk_7d INTEGER NOT NULL,
      availability_status TEXT NOT NULL,
      return_to_play_phase TEXT,
      session_type TEXT NOT NULL,
      is_match_day BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (athlete_id, recorded_at)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      match_date TIMESTAMPTZ NOT NULL,
      opponent TEXT NOT NULL,
      competition TEXT NOT NULL,
      venue TEXT NOT NULL,
      result_label TEXT,
      team_goals INTEGER,
      opponent_goals INTEGER,
      demo_tag TEXT NOT NULL DEFAULT 'demo'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS athlete_match_stats (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      minutes_played INTEGER NOT NULL,
      starting BOOLEAN NOT NULL,
      distance_meters DOUBLE PRECISION NOT NULL,
      sprint_count INTEGER NOT NULL,
      duels_won INTEGER NOT NULL,
      passes_completed INTEGER NOT NULL,
      shots INTEGER NOT NULL,
      expected_influence DOUBLE PRECISION NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS athlete_alerts (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      reason TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      category TEXT NOT NULL,
      alert_date TIMESTAMPTZ NOT NULL,
      metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS athlete_profiles (
      athlete_id TEXT PRIMARY KEY REFERENCES athletes(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      physical_score DOUBLE PRECISION NOT NULL,
      technical_score DOUBLE PRECISION NOT NULL,
      availability_score DOUBLE PRECISION NOT NULL,
      risk_score DOUBLE PRECISION NOT NULL,
      trend_label TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      generated_at TIMESTAMPTZ NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS athlete_risk_scores (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      recorded_at TIMESTAMPTZ NOT NULL,
      risk_probability DOUBLE PRECISION NOT NULL,
      risk_level TEXT NOT NULL,
      readiness_score DOUBLE PRECISION NOT NULL,
      load_score DOUBLE PRECISION NOT NULL,
      recovery_score DOUBLE PRECISION NOT NULL,
      explanation TEXT NOT NULL,
      payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS match_recommendations (
      match_id TEXT PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
      lineup_json JSONB NOT NULL,
      bench_json JSONB NOT NULL,
      unavailable_json JSONB NOT NULL,
      watchlist_json JSONB NOT NULL,
      summary TEXT NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL
    )
    """,
]


@dataclass
class PostgresRepository:
    database_url: str

    @contextmanager
    def connection(self):
        with connect(self.database_url, row_factory=dict_row) as conn:
            yield conn

    def create_tables(self) -> None:
        with self.connection() as conn:
            with conn.cursor() as cursor:
                for statement in DDL_STATEMENTS:
                    cursor.execute(statement)
            conn.commit()

    def truncate_demo_tables(self) -> None:
        with self.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    TRUNCATE TABLE
                      match_recommendations,
                      athlete_risk_scores,
                      athlete_profiles,
                      athlete_alerts,
                      athlete_match_stats,
                      matches,
                      athlete_daily_load,
                      athletes
                    RESTART IDENTITY CASCADE
                    """
                )
            conn.commit()

    def execute_many(self, statement: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        with self.connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(statement, rows)
            conn.commit()

    def fetch_all(self, statement: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
        with self.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(statement, params or ())
                return list(cursor.fetchall())

    def fetch_one(self, statement: str, params: tuple[Any, ...] | None = None) -> dict[str, Any] | None:
        rows = self.fetch_all(statement, params)
        return rows[0] if rows else None

