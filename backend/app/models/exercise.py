from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class MuscleGroup(str, Enum):
    chest = "chest"
    back = "back"
    shoulders = "shoulders"
    biceps = "biceps"
    triceps = "triceps"
    forearms = "forearms"
    core = "core"
    quads = "quads"
    hamstrings = "hamstrings"
    glutes = "glutes"
    calves = "calves"
    full_body = "full_body"
    cardio = "cardio"


class Equipment(str, Enum):
    barbell = "barbell"
    dumbbell = "dumbbell"
    kettlebell = "kettlebell"
    machine = "machine"
    cable = "cable"
    bodyweight = "bodyweight"
    resistance_band = "resistance_band"
    cardio_machine = "cardio_machine"
    other = "other"


class ExerciseCategory(str, Enum):
    strength = "strength"
    cardio = "cardio"
    mobility = "mobility"
    core = "core"


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    primary_muscle_group: MuscleGroup
    secondary_muscle_groups: Optional[str] = None  # comma-separated values
    equipment: Equipment
    category: ExerciseCategory
    instructions: Optional[str] = None
