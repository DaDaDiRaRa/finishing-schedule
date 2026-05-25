from pydantic import BaseModel
from typing import Literal

CATEGORIES = Literal["바닥", "벽", "천장", "걸레받이", "도장"]


class Material(BaseModel):
    code: str
    name: str
    manufacturer: str
    spec: str
    unit: str
    note: str = ""
    category: CATEGORIES


class MaterialCreate(BaseModel):
    name: str
    manufacturer: str
    spec: str
    unit: str
    note: str = ""
    category: CATEGORIES


class MaterialUpdate(BaseModel):
    name: str | None = None
    manufacturer: str | None = None
    spec: str | None = None
    unit: str | None = None
    note: str | None = None
    category: CATEGORIES | None = None
