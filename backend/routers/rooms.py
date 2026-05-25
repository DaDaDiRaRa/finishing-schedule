from fastapi import APIRouter, HTTPException
from models.room import Room, RoomCreate, RoomUpdate

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

# 인메모리 저장소 (프로덕션에서는 DB로 교체)
_rooms: dict[str, Room] = {}


@router.get("/", response_model=list[Room])
def list_rooms():
    return list(_rooms.values())


@router.get("/{room_id}", response_model=Room)
def get_room(room_id: str):
    room = _rooms.get(room_id)
    if room is None:
        raise HTTPException(404, "실을 찾을 수 없습니다.")
    return room


@router.post("/", response_model=Room, status_code=201)
def create_room(data: RoomCreate):
    room = data.to_room()
    _rooms[room.id] = room
    return room


@router.put("/{room_id}", response_model=Room)
def update_room(room_id: str, data: RoomUpdate):
    room = _rooms.get(room_id)
    if room is None:
        raise HTTPException(404, "실을 찾을 수 없습니다.")
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    updated = room.model_copy(update=patch)
    _rooms[room_id] = updated
    return updated


@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: str):
    if room_id not in _rooms:
        raise HTTPException(404, "실을 찾을 수 없습니다.")
    del _rooms[room_id]


@router.delete("/", status_code=204)
def clear_rooms():
    _rooms.clear()


@router.post("/bulk", response_model=list[Room], status_code=201)
def bulk_create(data: list[RoomCreate]):
    created = []
    for item in data:
        room = item.to_room()
        _rooms[room.id] = room
        created.append(room)
    return created
