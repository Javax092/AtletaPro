from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd


REQUIRED_COLUMNS: tuple[str, ...] = (
    "athleteId",
    "recordedAt",
    "distanceMeters",
    "sprintCount",
    "accelCount",
    "decelCount",
    "workload",
    "avgHeartRateBpm",
    "maxHeartRateBpm",
    "sessionMinutes",
    "perceivedEffort",
    "fatigueLevel",
    "sleepHours",
    "sorenessLevel",
)

NUMERIC_COLUMNS: tuple[str, ...] = (
    "distanceMeters",
    "sprintCount",
    "accelCount",
    "decelCount",
    "workload",
    "avgHeartRateBpm",
    "maxHeartRateBpm",
    "sessionMinutes",
    "perceivedEffort",
    "fatigueLevel",
    "sleepHours",
    "sorenessLevel",
)

TARGET_COLUMN = "injuryRisk7d"


def _validate_required_columns(columns: Iterable[str]) -> None:
    missing = [column for column in REQUIRED_COLUMNS if column not in columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")


def _safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    denominator = denominator.replace(0, np.nan)
    return numerator.div(denominator)


def _ensure_numeric_types(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    for column in NUMERIC_COLUMNS:
        result[column] = pd.to_numeric(result[column], errors="coerce")

    if TARGET_COLUMN in result.columns:
        result[TARGET_COLUMN] = pd.to_numeric(result[TARGET_COLUMN], errors="coerce")

    return result


def _rolling_sum(group: pd.DataFrame, column: str, window: str) -> pd.Series:
    indexed = group.set_index("recordedAt")[column]
    return indexed.rolling(window=window, min_periods=1).sum().reset_index(drop=True)


def _rolling_count(group: pd.DataFrame, window: str) -> pd.Series:
    indexed = pd.Series(1.0, index=group["recordedAt"])
    return indexed.rolling(window=window, min_periods=1).count().reset_index(drop=True)


def _rolling_mean(group: pd.DataFrame, column: str, window: str) -> pd.Series:
    indexed = group.set_index("recordedAt")[column]
    return indexed.rolling(window=window, min_periods=1).mean().reset_index(drop=True)


def _build_group_features(group: pd.DataFrame) -> pd.DataFrame:
    current = group.copy()

    current["acute_load_7d"] = _rolling_sum(current, "workload", "7D")
    current["chronic_load_28d"] = _rolling_sum(current, "workload", "28D")
    current["sessions_last_7d"] = _rolling_count(current, "7D")
    current["workload_mean_7d"] = _rolling_mean(current, "workload", "7D")
    current["workload_mean_prev_7d"] = current["workload_mean_7d"].shift(1)
    current["workload_trend_7d"] = current["workload_mean_7d"] - current["workload_mean_prev_7d"]

    current["acwr"] = _safe_divide(current["acute_load_7d"], current["chronic_load_28d"])
    current["intensity"] = _safe_divide(current["distanceMeters"], current["sessionMinutes"])
    current["internal_load"] = current["perceivedEffort"] * current["sessionMinutes"]

    sleep_deficit = (8.0 - current["sleepHours"]).clip(lower=0)
    current["fatigue_index"] = (
        current["fatigueLevel"].fillna(0) * 0.5
        + sleep_deficit.fillna(0) * 0.3
        + current["sorenessLevel"].fillna(0) * 0.2
    )
    current["heart_rate_ratio"] = _safe_divide(current["avgHeartRateBpm"], current["maxHeartRateBpm"])

    current["distance_per_sprint"] = _safe_divide(current["distanceMeters"], current["sprintCount"])
    current["accel_decel_balance"] = current["accelCount"] - current["decelCount"]
    current["workload_per_minute"] = _safe_divide(current["workload"], current["sessionMinutes"])
    current["rolling_fatigue_7d"] = _rolling_mean(current, "fatigueLevel", "7D")
    current["rolling_sleep_7d"] = _rolling_mean(current, "sleepHours", "7D")
    current["rolling_soreness_7d"] = _rolling_mean(current, "sorenessLevel", "7D")

    return current


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build training-ready athlete monitoring features.

    The input dataframe must contain at least the raw monitoring columns and
    optionally the target `injuryRisk7d`.
    """

    if df.empty:
        result = df.copy()
        for column in (
            "acute_load_7d",
            "chronic_load_28d",
            "acwr",
            "intensity",
            "internal_load",
            "sessions_last_7d",
            "workload_trend_7d",
            "fatigue_index",
            "heart_rate_ratio",
        ):
            result[column] = pd.Series(dtype="float64")
        return result

    _validate_required_columns(df.columns)

    result = df.copy()
    result["recordedAt"] = pd.to_datetime(result["recordedAt"], utc=True, errors="coerce")
    result = result.dropna(subset=["athleteId", "recordedAt"]).copy()
    result = _ensure_numeric_types(result)
    result = result.sort_values(["athleteId", "recordedAt"]).reset_index(drop=True)

    featured = (
        result.groupby("athleteId", group_keys=False, sort=False)
        .apply(_build_group_features)
        .reset_index(drop=True)
    )

    featured["days_since_previous_session"] = (
        featured.groupby("athleteId")["recordedAt"].diff().dt.total_seconds().div(86400)
    )

    numeric_feature_columns = [
        column
        for column in featured.columns
        if column not in {"athleteId", "recordedAt"}
    ]

    for column in numeric_feature_columns:
        if pd.api.types.is_numeric_dtype(featured[column]):
            featured[column] = featured[column].replace([np.inf, -np.inf], np.nan)

    featured["acwr"] = featured["acwr"].clip(lower=0)
    featured["heart_rate_ratio"] = featured["heart_rate_ratio"].clip(lower=0, upper=1.2)
    featured["days_since_previous_session"] = featured["days_since_previous_session"].fillna(0)
    featured["workload_trend_7d"] = featured["workload_trend_7d"].fillna(0)

    fill_zero_columns = [
        "acute_load_7d",
        "chronic_load_28d",
        "acwr",
        "intensity",
        "internal_load",
        "sessions_last_7d",
        "workload_trend_7d",
        "fatigue_index",
        "heart_rate_ratio",
        "distance_per_sprint",
        "accel_decel_balance",
        "workload_per_minute",
        "rolling_fatigue_7d",
        "rolling_sleep_7d",
        "rolling_soreness_7d",
    ]

    for column in fill_zero_columns:
        if column in featured.columns:
            featured[column] = featured[column].fillna(0)

    return featured
