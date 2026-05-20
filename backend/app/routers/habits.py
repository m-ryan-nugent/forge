from datetime import date as date_type, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.models.workout import WorkoutSession, WorkoutExercise

router = APIRouter(prefix="/habits", tags=["habits"])


def _intensity(exercise_count: int) -> int:
    if exercise_count == 0:
        return 0
    if exercise_count <= 2:
        return 1
    if exercise_count <= 4:
        return 2
    if exercise_count <= 6:
        return 3
    return 4


@router.get("/chart")
def get_chart(
    weeks: int = Query(default=52, ge=1, le=104),
    session: Session = Depends(get_session),
):
    today = date_type.today()
    # Align start to the Sunday of (weeks-1) weeks ago
    days_since_sunday = (today.weekday() + 1) % 7  # 0 if today is Sunday
    start = today - timedelta(days=days_since_sunday) - timedelta(weeks=weeks - 1)

    completed_workouts = session.exec(
        select(WorkoutSession)
        .where(WorkoutSession.date >= start)
        .where(WorkoutSession.date <= today)
        .where(WorkoutSession.completed == True)
    ).all()

    # Exercise count per workout
    exercise_counts: dict[int, int] = {}
    if completed_workouts:
        workout_ids = [w.id for w in completed_workouts]
        rows = session.exec(
            select(WorkoutExercise.workout_session_id, func.count().label("cnt"))
            .where(WorkoutExercise.workout_session_id.in_(workout_ids))
            .group_by(WorkoutExercise.workout_session_id)
        ).all()
        for wid, cnt in rows:
            exercise_counts[wid] = cnt

    # Group by date
    by_date: dict[date_type, list] = {}
    for w in completed_workouts:
        by_date.setdefault(w.date, []).append(w)

    total_days = weeks * 7
    result = []
    for i in range(total_days):
        d = start + timedelta(days=i)
        day_workouts = by_date.get(d, [])
        if not day_workouts:
            result.append({"date": str(d), "workout_count": 0, "intensity": 0, "titles": []})
            continue
        max_exercises = max(exercise_counts.get(w.id, 0) for w in day_workouts)
        result.append({
            "date": str(d),
            "workout_count": len(day_workouts),
            "intensity": _intensity(max_exercises),
            "titles": [w.title for w in day_workouts],
        })

    return result
