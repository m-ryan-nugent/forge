from datetime import date as date_type, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.exercise import Exercise
from app.models.workout import WorkoutSession, WorkoutExercise, SetEntry

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/exercise/{exercise_id}")
def exercise_progress(
    exercise_id: int,
    months: int = 6,
    session: Session = Depends(get_session),
):
    cutoff = date_type.today() - timedelta(days=months * 30)

    # Load WorkoutExercises for this exercise in completed sessions within range
    wes = session.exec(
        select(WorkoutExercise)
        .join(WorkoutSession, WorkoutSession.id == WorkoutExercise.workout_session_id)
        .where(WorkoutExercise.exercise_id == exercise_id)
        .where(WorkoutSession.completed == True)
        .where(WorkoutSession.date >= cutoff)
    ).all()

    if not wes:
        return []

    we_ids = [we.id for we in wes]
    session_ids = list({we.workout_session_id for we in wes})

    session_dates = {
        ws.id: ws.date
        for ws in session.exec(
            select(WorkoutSession).where(WorkoutSession.id.in_(session_ids))
        ).all()
    }
    we_to_session = {we.id: we.workout_session_id for we in wes}

    sets = session.exec(
        select(SetEntry)
        .where(SetEntry.workout_exercise_id.in_(we_ids))
        .where(SetEntry.completed == True)
        .where(SetEntry.weight.isnot(None))
    ).all()

    by_date: dict[str, dict] = {}
    for s in sets:
        sid = we_to_session.get(s.workout_exercise_id)
        d = str(session_dates.get(sid, ""))
        if not d:
            continue
        if d not in by_date:
            by_date[d] = {"max_weight": 0.0, "total_volume": 0.0, "set_count": 0}
        w = s.weight or 0.0
        r = s.reps or 0
        if w > by_date[d]["max_weight"]:
            by_date[d]["max_weight"] = w
        by_date[d]["total_volume"] += w * r
        by_date[d]["set_count"] += 1

    return [{"date": d, **v} for d, v in sorted(by_date.items())]


@router.get("/records")
def personal_records(session: Session = Depends(get_session)):
    completed_session_ids = {
        ws.id
        for ws in session.exec(
            select(WorkoutSession).where(WorkoutSession.completed == True)
        ).all()
    }

    if not completed_session_ids:
        return []

    wes = session.exec(
        select(WorkoutExercise).where(
            WorkoutExercise.workout_session_id.in_(completed_session_ids)
        )
    ).all()

    if not wes:
        return []

    we_ids = [we.id for we in wes]
    we_map = {we.id: we for we in wes}

    sets = session.exec(
        select(SetEntry)
        .where(SetEntry.workout_exercise_id.in_(we_ids))
        .where(SetEntry.completed == True)
        .where(SetEntry.weight.isnot(None))
    ).all()

    exercise_ids = list({we.exercise_id for we in wes})
    exercise_map = {
        ex.id: ex
        for ex in session.exec(
            select(Exercise).where(Exercise.id.in_(exercise_ids))
        ).all()
    }

    session_dates = {
        ws.id: ws.date
        for ws in session.exec(
            select(WorkoutSession).where(
                WorkoutSession.id.in_(completed_session_ids)
            )
        ).all()
    }

    records: dict[int, dict] = {}
    for s in sets:
        we = we_map.get(s.workout_exercise_id)
        if not we:
            continue
        ex = exercise_map.get(we.exercise_id)
        if not ex:
            continue
        eid = ex.id
        w = s.weight or 0.0
        if eid not in records or w > records[eid]["max_weight"]:
            sid = we.workout_session_id
            records[eid] = {
                "exercise_id": eid,
                "exercise_name": ex.name,
                "muscle_group": ex.primary_muscle_group.value,
                "max_weight": w,
                "reps_at_max": s.reps,
                "date": str(session_dates.get(sid, "")),
            }

    return sorted(records.values(), key=lambda r: r["muscle_group"])


@router.get("/volume")
def volume_by_muscle(weeks: int = 12, session: Session = Depends(get_session)):
    cutoff = date_type.today() - timedelta(weeks=weeks)

    completed_sessions = {
        ws.id: ws.date
        for ws in session.exec(
            select(WorkoutSession)
            .where(WorkoutSession.completed == True)
            .where(WorkoutSession.date >= cutoff)
        ).all()
    }

    if not completed_sessions:
        return []

    wes = session.exec(
        select(WorkoutExercise).where(
            WorkoutExercise.workout_session_id.in_(list(completed_sessions.keys()))
        )
    ).all()

    if not wes:
        return []

    we_ids = [we.id for we in wes]
    we_map = {we.id: we for we in wes}

    exercise_ids = list({we.exercise_id for we in wes})
    exercise_map = {
        ex.id: ex
        for ex in session.exec(
            select(Exercise).where(Exercise.id.in_(exercise_ids))
        ).all()
    }

    sets = session.exec(
        select(SetEntry)
        .where(SetEntry.workout_exercise_id.in_(we_ids))
        .where(SetEntry.completed == True)
    ).all()

    by_week_muscle: dict[tuple, float] = {}
    for s in sets:
        we = we_map.get(s.workout_exercise_id)
        if not we:
            continue
        ex = exercise_map.get(we.exercise_id)
        if not ex:
            continue
        d = completed_sessions.get(we.workout_session_id)
        if not d:
            continue
        week_start = d - timedelta(days=d.weekday())
        muscle = ex.primary_muscle_group.value
        volume = (s.weight or 0.0) * (s.reps or 0)
        key = (str(week_start), muscle)
        by_week_muscle[key] = by_week_muscle.get(key, 0.0) + volume

    return [
        {"week_start": k[0], "muscle_group": k[1], "total_volume": v}
        for k, v in sorted(by_week_muscle.items())
    ]


@router.get("/frequency")
def workout_frequency(months: int = 6, session: Session = Depends(get_session)):
    cutoff = date_type.today() - timedelta(days=months * 30)

    dates = session.exec(
        select(WorkoutSession.date)
        .where(WorkoutSession.completed == True)
        .where(WorkoutSession.date >= cutoff)
    ).all()

    by_week: dict[str, int] = {}
    for d in dates:
        week_start = d - timedelta(days=d.weekday())
        key = str(week_start)
        by_week[key] = by_week.get(key, 0) + 1

    return [{"week_start": k, "count": v} for k, v in sorted(by_week.items())]
