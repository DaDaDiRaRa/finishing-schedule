from fastapi import APIRouter, HTTPException
from models.material import Material, MaterialCreate, MaterialUpdate
import services.material_mapper as mapper

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("/", response_model=list[Material])
def list_materials(q: str = ""):
    if q:
        return mapper.search(q)
    return mapper.get_all()


@router.get("/{code}", response_model=Material)
def get_material(code: str):
    m = mapper.get_by_code(code)
    if m is None:
        raise HTTPException(404, f"코드 '{code}'를 찾을 수 없습니다.")
    return m


@router.post("/", response_model=Material, status_code=201)
def create_material(code: str, data: MaterialCreate):
    try:
        return mapper.create(code, data)
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.put("/{code}", response_model=Material)
def update_material(code: str, data: MaterialUpdate):
    try:
        return mapper.update(code, data)
    except KeyError as e:
        raise HTTPException(404, str(e))


@router.delete("/{code}", status_code=204)
def delete_material(code: str):
    try:
        mapper.delete(code)
    except KeyError as e:
        raise HTTPException(404, str(e))


@router.post("/lookup")
def lookup(codes: list[str]) -> dict:
    result = mapper.lookup_codes(codes)
    return {
        code: mat.model_dump() if mat else None
        for code, mat in result.items()
    }
