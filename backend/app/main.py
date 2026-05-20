from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models.exercise import Exercise, MuscleGroup, Equipment, ExerciseCategory
from app.routers import exercises, workouts

app = FastAPI(title="Forge API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_SEED_EXERCISES = [
    Exercise(name="Bench Press", primary_muscle_group=MuscleGroup.chest, secondary_muscle_groups="triceps,shoulders", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Incline Dumbbell Press", primary_muscle_group=MuscleGroup.chest, secondary_muscle_groups="triceps,shoulders", equipment=Equipment.dumbbell, category=ExerciseCategory.strength),
    Exercise(name="Cable Fly", primary_muscle_group=MuscleGroup.chest, equipment=Equipment.cable, category=ExerciseCategory.strength),
    Exercise(name="Pull-Up", primary_muscle_group=MuscleGroup.back, secondary_muscle_groups="biceps", equipment=Equipment.bodyweight, category=ExerciseCategory.strength),
    Exercise(name="Barbell Row", primary_muscle_group=MuscleGroup.back, secondary_muscle_groups="biceps", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Lat Pulldown", primary_muscle_group=MuscleGroup.back, secondary_muscle_groups="biceps", equipment=Equipment.cable, category=ExerciseCategory.strength),
    Exercise(name="Deadlift", primary_muscle_group=MuscleGroup.back, secondary_muscle_groups="glutes,hamstrings,quads", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Overhead Press", primary_muscle_group=MuscleGroup.shoulders, secondary_muscle_groups="triceps", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Lateral Raise", primary_muscle_group=MuscleGroup.shoulders, equipment=Equipment.dumbbell, category=ExerciseCategory.strength),
    Exercise(name="Face Pull", primary_muscle_group=MuscleGroup.shoulders, secondary_muscle_groups="back", equipment=Equipment.cable, category=ExerciseCategory.strength),
    Exercise(name="Bicep Curl", primary_muscle_group=MuscleGroup.biceps, equipment=Equipment.dumbbell, category=ExerciseCategory.strength),
    Exercise(name="Hammer Curl", primary_muscle_group=MuscleGroup.biceps, secondary_muscle_groups="forearms", equipment=Equipment.dumbbell, category=ExerciseCategory.strength),
    Exercise(name="Tricep Pushdown", primary_muscle_group=MuscleGroup.triceps, equipment=Equipment.cable, category=ExerciseCategory.strength),
    Exercise(name="Skull Crusher", primary_muscle_group=MuscleGroup.triceps, equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Squat", primary_muscle_group=MuscleGroup.quads, secondary_muscle_groups="glutes,hamstrings", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Leg Press", primary_muscle_group=MuscleGroup.quads, secondary_muscle_groups="glutes", equipment=Equipment.machine, category=ExerciseCategory.strength),
    Exercise(name="Romanian Deadlift", primary_muscle_group=MuscleGroup.hamstrings, secondary_muscle_groups="glutes,back", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Hip Thrust", primary_muscle_group=MuscleGroup.glutes, secondary_muscle_groups="hamstrings", equipment=Equipment.barbell, category=ExerciseCategory.strength),
    Exercise(name="Calf Raise", primary_muscle_group=MuscleGroup.calves, equipment=Equipment.machine, category=ExerciseCategory.strength),
    Exercise(name="Plank", primary_muscle_group=MuscleGroup.core, equipment=Equipment.bodyweight, category=ExerciseCategory.core),
    Exercise(name="Cable Crunch", primary_muscle_group=MuscleGroup.core, equipment=Equipment.cable, category=ExerciseCategory.core),
    Exercise(name="Treadmill Run", primary_muscle_group=MuscleGroup.cardio, equipment=Equipment.cardio_machine, category=ExerciseCategory.cardio),
    Exercise(name="Rowing Machine", primary_muscle_group=MuscleGroup.cardio, secondary_muscle_groups="back,core", equipment=Equipment.cardio_machine, category=ExerciseCategory.cardio),
]


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        if not session.exec(select(Exercise)).first():
            for ex in _SEED_EXERCISES:
                session.add(ex)
            session.commit()


app.include_router(exercises.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
