from datetime import datetime
from datetime import date as date_type
from typing import Optional
from sqlmodel import Field, SQLModel


class WorkoutSessionCreate(SQLModel):
    title: str
    date: Optional[date_type] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    completed: bool = False


class WorkoutSessionUpdate(SQLModel):
    title: Optional[str] = None
    date: Optional[date_type] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None


class WorkoutSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: date_type = Field(default_factory=date_type.today)
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WorkoutExercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_session_id: int = Field(foreign_key="workoutsession.id")
    exercise_id: int = Field(foreign_key="exercise.id")
    order: int = Field(default=0)
    notes: Optional[str] = None


class SetEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_exercise_id: int = Field(foreign_key="workoutexercise.id")
    set_number: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance: Optional[float] = None
    completed: bool = Field(default=False)
