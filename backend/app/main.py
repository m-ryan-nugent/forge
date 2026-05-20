from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import exercises, workouts

app = FastAPI(title="Forge API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.include_router(exercises.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
