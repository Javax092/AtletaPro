from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from random import Random
from typing import Any
from uuid import uuid4

import pandas as pd


POSITION_PROFILES = {
    "Goleiro": {"distance": (2800, 4200), "sprints": (0, 4), "hr": (118, 148), "workload": (130, 240), "minutes": (70, 95)},
    "Zagueiro": {"distance": (6200, 8600), "sprints": (4, 11), "hr": (136, 162), "workload": (280, 430), "minutes": (72, 96)},
    "Lateral": {"distance": (8300, 11200), "sprints": (14, 26), "hr": (148, 172), "workload": (360, 560), "minutes": (72, 96)},
    "Volante": {"distance": (7800, 10600), "sprints": (10, 18), "hr": (145, 169), "workload": (350, 520), "minutes": (72, 96)},
    "Meio-campo": {"distance": (8400, 11100), "sprints": (11, 20), "hr": (147, 171), "workload": (360, 540), "minutes": (72, 96)},
    "Ponta": {"distance": (8800, 11800), "sprints": (18, 32), "hr": (150, 176), "workload": (390, 590), "minutes": (68, 94)},
    "Atacante": {"distance": (7600, 10300), "sprints": (16, 28), "hr": (146, 174), "workload": (340, 540), "minutes": (65, 93)},
}

SQUAD_SHAPE = [
    ("Goleiro", 4),
    ("Zagueiro", 8),
    ("Lateral", 6),
    ("Volante", 5),
    ("Meio-campo", 8),
    ("Ponta", 7),
    ("Atacante", 6),
]

STATUS_LABELS = [
    "Disponível",
    "Em controle de carga",
    "Retorno progressivo",
    "Preservado",
]

FIRST_NAMES = [
    "Lucas", "Joao", "Pedro", "Mateus", "Caio", "Rafael", "Gabriel", "Bruno", "Tiago", "Felipe",
    "Diego", "Andre", "Vitor", "Murilo", "Henrique", "Renato", "Guilherme", "David", "Yuri", "Caua",
]

LAST_NAMES = [
    "Silva", "Souza", "Oliveira", "Costa", "Santos", "Pereira", "Mendes", "Barbosa", "Rocha", "Araujo",
    "Ferreira", "Almeida", "Ribeiro", "Carvalho", "Lima", "Goncalves", "Teixeira", "Batista", "Moraes", "Rezende",
]


@dataclass
class DemoEnvironment:
    athletes: list[dict[str, Any]]
    daily_loads: list[dict[str, Any]]
    matches: list[dict[str, Any]]
    athlete_match_stats: list[dict[str, Any]]

    def training_dataframe(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "athleteId": item["athlete_id"],
                    "recordedAt": item["recorded_at"],
                    "distanceMeters": item["distance_meters"],
                    "sprintCount": item["sprint_count"],
                    "accelCount": item["accel_count"],
                    "decelCount": item["decel_count"],
                    "workload": item["workload"],
                    "avgHeartRateBpm": item["avg_heart_rate_bpm"],
                    "maxHeartRateBpm": item["max_heart_rate_bpm"],
                    "sessionMinutes": item["session_minutes"],
                    "perceivedEffort": item["perceived_effort"],
                    "fatigueLevel": item["fatigue_level"],
                    "sleepHours": item["sleep_hours"],
                    "sorenessLevel": item["soreness_level"],
                    "injuryRisk7d": item["injury_risk_7d"],
                }
                for item in self.daily_loads
            ]
        )


def _bounded(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _build_athletes(randomizer: Random, club_name: str, squad_size: int) -> list[dict[str, Any]]:
    athletes: list[dict[str, Any]] = []
    athlete_index = 0

    for position, count in SQUAD_SHAPE:
        for _ in range(count):
            athlete_index += 1
            birth_year = randomizer.randint(1996, 2007)
            birth_date = datetime(birth_year, randomizer.randint(1, 12), randomizer.randint(1, 26), tzinfo=UTC)
            age = int((datetime.now(UTC) - birth_date).days / 365.25)
            status = randomizer.choices(STATUS_LABELS, weights=[0.62, 0.18, 0.1, 0.1], k=1)[0]
            athletes.append(
                {
                    "id": f"demo_athlete_{athlete_index:03d}",
                    "full_name": f"{randomizer.choice(FIRST_NAMES)} {randomizer.choice(LAST_NAMES)}",
                    "position": position,
                    "current_status": status,
                    "current_team": club_name,
                    "birth_date": birth_date.date().isoformat(),
                    "age": age,
                    "availability_status": "AVAILABLE" if status == "Disponível" else "MONITORING",
                }
            )
            if athlete_index >= squad_size:
                return athletes

    return athletes


def _injury_risk_flag(readiness_penalty: float, fatigue: float, soreness: float, sleep_hours: float, workload_ratio: float) -> int:
    score = readiness_penalty + fatigue * 0.08 + soreness * 0.07 + max(0, 6.8 - sleep_hours) * 0.1 + max(0, workload_ratio - 1.15) * 0.55
    return 1 if score >= 1.05 else 0


def _session_type_for_day(day_offset: int) -> str:
    weekday = day_offset % 7
    if weekday in {2, 5}:
        return "MATCH"
    if weekday in {1, 4}:
        return "HIGH_INTENSITY"
    if weekday in {0, 3}:
        return "TACTICAL"
    return "RECOVERY"


def generate_demo_environment(
    squad_size: int = 44,
    days: int = 84,
    seed: int = 42,
    club_name: str = "Manaus Performance FC",
) -> DemoEnvironment:
    randomizer = Random(seed)
    athletes = _build_athletes(randomizer, club_name, squad_size)
    start_date = datetime.now(UTC) - timedelta(days=days)

    daily_loads: list[dict[str, Any]] = []
    matches: list[dict[str, Any]] = []
    athlete_match_stats: list[dict[str, Any]] = []

    match_days: list[datetime] = []
    for offset in range(6, days, 7):
        match_days.append(start_date + timedelta(days=offset, hours=19))

    for match_index, match_day in enumerate(match_days, start=1):
        matches.append(
            {
                "id": f"demo_match_{match_index:03d}",
                "match_date": match_day.isoformat(),
                "opponent": randomizer.choice(["Atletico Norte", "Rio Negro SC", "Amazonia FC", "Nacional B", "Operario do Norte"]),
                "competition": randomizer.choice(["Liga Regional", "Copa Estadual", "Torneio Preparatório"]),
                "venue": randomizer.choice(["HOME", "AWAY"]),
                "result_label": randomizer.choice(["WIN", "DRAW", "LOSS"]),
                "team_goals": randomizer.randint(0, 3),
                "opponent_goals": randomizer.randint(0, 2),
            }
        )

    athlete_form_bias = {athlete["id"]: randomizer.uniform(-0.12, 0.12) for athlete in athletes}
    athlete_risk_bias = {athlete["id"]: randomizer.uniform(0, 0.35) for athlete in athletes}

    risk_groups = randomizer.sample([athlete["id"] for athlete in athletes], k=max(6, squad_size // 6))
    return_groups = randomizer.sample([athlete["id"] for athlete in athletes if athlete["id"] not in risk_groups], k=max(4, squad_size // 10))
    unavailable_groups = randomizer.sample([athlete["id"] for athlete in athletes if athlete["id"] not in risk_groups], k=max(3, squad_size // 14))

    for athlete in athletes:
        profile = POSITION_PROFILES[athlete["position"]]
        athlete_id = athlete["id"]
        athlete_match_count = 0

        for day_index in range(days):
            recorded_at = start_date + timedelta(days=day_index, hours=9)
            session_type = _session_type_for_day(day_index)
            is_match_day = any(abs((recorded_at - match_day).total_seconds()) < 3600 * 12 for match_day in match_days)

            base_distance = randomizer.uniform(*profile["distance"])
            base_sprints = randomizer.randint(*profile["sprints"])
            base_workload = randomizer.uniform(*profile["workload"])
            base_minutes = randomizer.uniform(*profile["minutes"])
            base_avg_hr = randomizer.uniform(*profile["hr"])
            max_hr = base_avg_hr + randomizer.uniform(12, 24)

            if session_type == "RECOVERY":
                distance_factor = 0.52
                workload_factor = 0.48
                minute_factor = 0.72
            elif session_type == "TACTICAL":
                distance_factor = 0.82
                workload_factor = 0.76
                minute_factor = 0.86
            elif session_type == "MATCH":
                distance_factor = 1.08
                workload_factor = 1.1
                minute_factor = 1.0
            else:
                distance_factor = 1.0
                workload_factor = 1.0
                minute_factor = 0.92

            form_adjustment = 1 + athlete_form_bias[athlete_id]
            risk_penalty = 1 + athlete_risk_bias[athlete_id] if athlete_id in risk_groups else 1
            return_penalty = 0.84 if athlete_id in return_groups else 1
            unavailable_penalty = 0.58 if athlete_id in unavailable_groups and day_index > days - 15 else 1

            distance = base_distance * distance_factor * form_adjustment * return_penalty * unavailable_penalty
            sprints = int(round(base_sprints * distance_factor * form_adjustment * return_penalty))
            workload = base_workload * workload_factor * risk_penalty * return_penalty * unavailable_penalty
            minutes = base_minutes * minute_factor * return_penalty * unavailable_penalty
            avg_hr = base_avg_hr * (1 + athlete_risk_bias[athlete_id] * 0.12)

            sleep_hours = _bounded(randomizer.gauss(7.2, 0.7) - (0.8 if athlete_id in risk_groups else 0) + (0.2 if athlete_id in return_groups else 0), 4.6, 9.2)
            soreness = _bounded(randomizer.gauss(3.4, 1.4) + (2.1 if athlete_id in risk_groups else 0) + (1.6 if is_match_day else 0), 0.5, 9.5)
            fatigue = _bounded(randomizer.gauss(4.6, 1.3) + (1.9 if athlete_id in risk_groups else 0) + (1.2 if is_match_day else 0), 1.2, 9.7)
            perceived_effort = _bounded(randomizer.gauss(6.3, 1.1) + (1.0 if session_type in {"MATCH", "HIGH_INTENSITY"} else -0.4), 2.5, 9.8)
            accel_count = max(1, int(round(sprints * randomizer.uniform(1.15, 1.55))))
            decel_count = max(1, int(round(sprints * randomizer.uniform(1.05, 1.45))))

            chronic_proxy = profile["workload"][1]
            workload_ratio = workload / chronic_proxy if chronic_proxy else 1
            injury_risk_7d = _injury_risk_flag(
                readiness_penalty=athlete_risk_bias[athlete_id],
                fatigue=fatigue,
                soreness=soreness,
                sleep_hours=sleep_hours,
                workload_ratio=workload_ratio,
            )

            availability_status = "UNAVAILABLE" if athlete_id in unavailable_groups and day_index > days - 10 else (
                "RETURN_TO_PLAY" if athlete_id in return_groups and day_index > days - 21 else (
                    "MONITORING" if athlete_id in risk_groups and day_index > days - 18 else "AVAILABLE"
                )
            )

            daily_loads.append(
                {
                    "athlete_id": athlete_id,
                    "recorded_at": recorded_at.isoformat(),
                    "distance_meters": round(distance, 2),
                    "sprint_count": sprints,
                    "accel_count": accel_count,
                    "decel_count": decel_count,
                    "workload": round(workload, 2),
                    "avg_heart_rate_bpm": round(avg_hr, 2),
                    "max_heart_rate_bpm": round(max_hr, 2),
                    "session_minutes": round(minutes, 2),
                    "perceived_effort": round(perceived_effort, 2),
                    "fatigue_level": round(fatigue, 2),
                    "sleep_hours": round(sleep_hours, 2),
                    "soreness_level": round(soreness, 2),
                    "injury_risk_7d": injury_risk_7d,
                    "availability_status": availability_status,
                    "return_to_play_phase": "CONTROLLED_RETURN" if availability_status == "RETURN_TO_PLAY" else None,
                    "session_type": session_type,
                    "is_match_day": is_match_day,
                }
            )

            if is_match_day and availability_status != "UNAVAILABLE" and athlete_match_count < len(matches):
                match = min(matches, key=lambda item: abs(datetime.fromisoformat(item["match_date"]) - recorded_at))
                likely_starter = athlete["position"] != "Goleiro" and randomizer.random() > 0.38
                match_minutes = int(_bounded(randomizer.gauss(78 if likely_starter else 24, 18), 0, 95))
                athlete_match_stats.append(
                    {
                        "id": str(uuid4()),
                        "match_id": match["id"],
                        "athlete_id": athlete_id,
                        "minutes_played": match_minutes,
                        "starting": likely_starter,
                        "distance_meters": round(distance * randomizer.uniform(0.88, 1.08), 2),
                        "sprint_count": max(0, int(round(sprints * randomizer.uniform(0.75, 1.18)))),
                        "duels_won": randomizer.randint(1, 11),
                        "passes_completed": randomizer.randint(8, 62),
                        "shots": randomizer.randint(0, 5 if athlete["position"] in {"Ponta", "Atacante"} else 2),
                        "expected_influence": round(randomizer.uniform(0.2, 0.95), 3),
                    }
                )
                athlete_match_count += 1

    return DemoEnvironment(
        athletes=athletes,
        daily_loads=daily_loads,
        matches=matches,
        athlete_match_stats=athlete_match_stats,
    )
