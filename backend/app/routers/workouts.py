from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.workout import WorkoutSession, WorkoutExercise, SetEntry

router = APIRouter(prefix="/workouts", tags=["workouts"])


# --- Workout Sessions ---

@router.get("/", response_model=List[WorkoutSession])
def list_workouts(session: Session = Depends(get_session)):
    return session.exec(select(WorkoutSession).order_by(WorkoutSession.date.desc())).all()


@router.get("/{workout_id}", response_model=WorkoutSession)
def get_workout(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(WorkoutSession, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.post("/", response_model=WorkoutSession, status_code=201)
def create_workout(workout: WorkoutSession, session: Session = Depends(get_session)):
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


@router.put("/{workout_id}", response_model=WorkoutSession)
def update_workout(
    workout_id: int, updates: WorkoutSession, session: Session = Depends(get_session)
):
    workout = session.get(WorkoutSession, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    data = updates.model_dump(exclude_unset=True, exclude={"id"})
    for key, value in data.items():
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
