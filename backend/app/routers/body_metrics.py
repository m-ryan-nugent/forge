from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.body_metric import BodyMetric, BodyMetricCreate

router = APIRouter(prefix="/body-metrics", tags=["body-metrics"])


@router.get("/", response_model=List[BodyMetric])
def list_body_metrics(session: Session = Depends(get_session)):
    return session.exec(select(BodyMetric).order_by(BodyMetric.date.desc())).all()


@router.post("/", response_model=BodyMetric, status_code=201)
def create_body_metric(data: BodyMetricCreate, session: Session = Depends(get_session)):
    metric = BodyMetric(**data.model_dump())
    session.add(metric)
    session.commit()
    session.refresh(metric)
    return metric


@router.delete("/{metric_id}", status_code=204)
def delete_body_metric(metric_id: int, session: Session = Depends(get_session)):
    metric = session.get(BodyMetric, metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Body metric not found")
    session.delete(metric)
    session.commit()
