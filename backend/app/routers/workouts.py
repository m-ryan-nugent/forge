from datetime import date as date_type, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.models.exercise import Exercise
from app.models.workout import WorkoutSession, WorkoutSessionCreate, WorkoutSessionUpdate, WorkoutSessionSummary, WorkoutExercise, SetEntry

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _compute_streak(workout_dates: list) -> int:
    if not workout_dates:
        return 0
    unique_dates = sorted(set(workout_dates), reverse=True)
    today = date_type.today()
    if unique_dates[0] < today - timedelta(days=1):
        return 0
    streak = 0
    check = unique_dates[0]
    for d in unique_dates:
        if d == check:
            streak += 1
            check -= timedelta(days=1)
        else:
            break
    return streak


# --- Workout Sessions ---

@router.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    today = date_type.today()
    week_start = today - timedelta(days=today.weekday())  # Monday

    all_workouts = session.exec(select(WorkoutSession)).all()
    completed = [w for w in all_workouts if w.completed]

    weekly_count = sum(1 for w in completed if w.date >= week_start)
    current_streak = _compute_streak([w.date for w in completed])

    last = max(completed, key=lambda w: w.date) if completed else None

    muscle_groups = list(set(
        mg.value
        for mg in session.exec(
            select(Exercise.primary_muscle_group)
            .join(WorkoutExercise, WorkoutExercise.exercise_id == Exercise.id)
            .join(WorkoutSession, WorkoutSession.id == WorkoutExercise.workout_session_id)
            .where(WorkoutSession.completed == True)
            .where(WorkoutSession.date >= week_start)
        ).all()
    ))

    return {
        "total_completed": len(completed),
        "total_all": len(all_workouts),
        "weekly_count": weekly_count,
        "current_streak": current_streak,
        "last_workout": {"id": last.id, "title": last.title, "date": str(last.date)} if last else None,
        "muscle_groups_this_week": muscle_groups,
    }


@router.get("/", response_model=List[WorkoutSessionSummary])
def list_workouts(session: Session = Depends(get_session)):
    workouts = session.exec(select(WorkoutSession).order_by(WorkoutSession.date.desc())).all()
    result = []
    for w in workouts:
        count = session.exec(
            select(func.count()).select_from(WorkoutExercise).where(WorkoutExercise.workout_session_id == w.id)
        ).one()
        result.append(WorkoutSessionSummary(**w.model_dump(), exercise_count=count))
    return result


@router.get("/{workout_id}", response_model=WorkoutSession)
def get_workout(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(WorkoutSession, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.post("/", response_model=WorkoutSession, status_code=201)
def create_workout(data: WorkoutSessionCreate, session: Session = Depends(get_session)):
    workout = WorkoutSession(**data.model_dump(exclude_unset=True))
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


@router.put("/{workout_id}", response_model=WorkoutSession)
def update_workout(
    workout_id: int, updates: WorkoutSessionUpdate, session: Session = Depends(get_session)
):
    workout = session.get(WorkoutSession, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(workout, key, value)
    session.commit()
    session.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(WorkoutSession, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    session.delete(workout)
    session.commit()


# --- Workout Exercises ---

@router.get("/{workout_id}/exercises", response_model=List[WorkoutExercise])
def list_workout_exercises(workout_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(WorkoutExercise)
        .where(WorkoutExercise.workout_session_id == workout_id)
        .order_by(WorkoutExercise.order)
    ).all()


@router.post("/{workout_id}/exercises", response_model=WorkoutExercise, status_code=201)
def add_exercise_to_workout(
    workout_id: int, workout_exercise: WorkoutExercise, session: Session = Depends(get_session)
):
    workout_exercise.workout_session_id = workout_id
    session.add(workout_exercise)
    session.commit()
    session.refresh(workout_exercise)
    return workout_exercise


@router.delete("/{workout_id}/exercises/{we_id}", status_code=204)
def remove_exercise_from_workout(
    workout_id: int, we_id: int, session: Session = Depends(get_session)
):
    we = session.get(WorkoutExercise, we_id)
    if not we or we.workout_session_id != workout_id:
        raise HTTPException(status_code=404, detail="Workout exercise not found")
    session.delete(we)
    session.commit()


# --- Set Entries ---

@router.get("/{workout_id}/exercises/{we_id}/sets", response_model=List[SetEntry])
def list_sets(workout_id: int, we_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(SetEntry)
        .where(SetEntry.workout_exercise_id == we_id)
        .order_by(SetEntry.set_number)
    ).all()


@router.post("/{workout_id}/exercises/{we_id}/sets", response_model=SetEntry, status_code=201)
def add_set(
    workout_id: int, we_id: int, set_entry: SetEntry, session: Session = Depends(get_session)
):
    set_entry.workout_exercise_id = we_id
    session.add(set_entry)
    session.commit()
    session.refresh(set_entry)
    return set_entry


@router.put("/{workout_id}/exercises/{we_id}/sets/{set_id}", response_model=SetEntry)
def update_set(
    workout_id: int, we_id: int, set_id: int, updates: SetEntry, session: Session = Depends(get_session)
):
    set_entry = session.get(SetEntry, set_id)
    if not set_entry or set_entry.workout_exercise_id != we_id:
        raise HTTPException(status_code=404, detail="Set not found")
    data = updates.model_dump(exclude_unset=True, exclude={"id"})
    for key, value in data.items():
        setattr(set_entry, key, value)
    session.commit()
    session.refresh(set_entry)
    return set_entry


@router.delete("/{workout_id}/exercises/{we_id}/sets/{set_id}", status_code=204)
def delete_set(
    workout_id: int, we_id: int, set_id: int, session: Session = Depends(get_session)
):
    set_entry = session.get(SetEntry, set_id)
    if not set_entry or set_entry.workout_exercise_id != we_id:
        raise HTTPException(status_code=404, detail="Set not found")
    session.delete(set_entry)
    session.commit()
