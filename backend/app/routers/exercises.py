from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.exercise import Exercise, MuscleGroup, Equipment, ExerciseCategory

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("/", response_model=List[Exercise])
def list_exercises(
    muscle_group: Optional[MuscleGroup] = None,
    equipment: Optional[Equipment] = None,
    category: Optional[ExerciseCategory] = None,
    search: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
):
    query = select(Exercise)
    if muscle_group:
        query = query.where(Exercise.primary_muscle_group == muscle_group)
    if equipment:
        query = query.where(Exercise.equipment == equipment)
    if category:
        query = query.where(Exercise.category == category)
    if search:
        query = query.where(Exercise.name.ilike(f"%{search}%"))
    return session.exec(query).all()


@router.get("/{exercise_id}", response_model=Exercise)
def get_exercise(exercise_id: int, session: Session = Depends(get_session)):
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.post("/", response_model=Exercise, status_code=201)
def create_exercise(exercise: Exercise, session: Session = Depends(get_session)):
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise


@router.put("/{exercise_id}", response_model=Exercise)
def update_exercise(
    exercise_id: int, updates: Exercise, session: Session = Depends(get_session)
):
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    data = updates.model_dump(exclude_unset=True, exclude={"id"})
    for key, value in data.items():
        setattr(exercise, key, value)
    session.commit()
    session.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: int, session: Session = Depends(get_session)):
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    session.delete(exercise)
    session.commit()
