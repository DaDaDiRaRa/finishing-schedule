"""마감재 코드 → DB 매핑 서비스."""
import json
from pathlib import Path
from typing import Optional
from models.material import Material, MaterialCreate, MaterialUpdate

DB_PATH = Path(__file__).parent.parent / "data" / "materials_db.json"


def _load() -> dict:
    with open(DB_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save(data: dict) -> None:
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_all() -> list[Material]:
    db = _load()
    return [Material(code=code, **info) for code, info in db.items()]


def get_by_code(code: str) -> Optional[Material]:
    db = _load()
    info = db.get(code)
    if info is None:
        return None
    return Material(code=code, **info)


def lookup_codes(codes: list[str]) -> dict[str, Optional[Material]]:
    """코드 리스트를 일괄 조회. 미등록 코드는 None 반환."""
    db = _load()
    result: dict[str, Optional[Material]] = {}
    for code in codes:
        if not code:
            continue
        info = db.get(code)
        result[code] = Material(code=code, **info) if info else None
    return result


def create(code: str, data: MaterialCreate) -> Material:
    db = _load()
    if code in db:
        raise ValueError(f"코드 '{code}'가 이미 존재합니다.")
    db[code] = data.model_dump()
    _save(db)
    return Material(code=code, **data.model_dump())


def update(code: str, data: MaterialUpdate) -> Material:
    db = _load()
    if code not in db:
        raise KeyError(f"코드 '{code}'를 찾을 수 없습니다.")
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    db[code].update(patch)
    _save(db)
    return Material(code=code, **db[code])


def delete(code: str) -> None:
    db = _load()
    if code not in db:
        raise KeyError(f"코드 '{code}'를 찾을 수 없습니다.")
    del db[code]
    _save(db)


def search(keyword: str) -> list[Material]:
    """이름·제조사·코드에서 키워드 검색."""
    kw = keyword.lower()
    return [
        m for m in get_all()
        if kw in m.code.lower()
        or kw in m.name.lower()
        or kw in m.manufacturer.lower()
        or kw in m.category.lower()
    ]
