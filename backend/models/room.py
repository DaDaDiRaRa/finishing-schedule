from pydantic import BaseModel
from typing import Optional
import uuid


class RoomFinish(BaseModel):
    floor: str = ""      # 바닥 코드
    wall: str = ""       # 벽 코드
    ceiling: str = ""    # 천장 코드
    skirting: str = ""   # 걸레받이 코드
    paint: str = ""      # 도장 코드


class Room(BaseModel):
    id: str
    name: str
    purpose: str = ""
    floor_level: str = ""   # 층 (예: "1F", "B1", "RF")
    finishes: RoomFinish = RoomFinish()


class RoomCreate(BaseModel):
    name: str
    purpose: str = ""
    floor_level: str = ""
    finishes: RoomFinish = RoomFinish()

    def to_room(self) -> Room:
        return Room(id=str(uuid.uuid4()), **self.model_dump())


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    floor_level: Optional[str] = None
    finishes: Optional[RoomFinish] = None
