from datetime import date as date_type
from typing import Optional
from sqlmodel import Field, SQLModel


class BodyMetricCreate(SQLModel):
    date: date_type
    body_weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    notes: Optional[str] = None


class BodyMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: date_type
    body_weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    notes: Optional[str] = None
