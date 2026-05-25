from typing import Annotated
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import Response
from models.room import Room
from services.schedule_generator import generate, parse_import

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.post("/export")
def export_excel(rooms: Annotated[list[Room], Body()]):
    if not rooms:
        raise HTTPException(400, "실 목록이 비어 있습니다.")
    xlsx_bytes, unresolved = generate(rooms)
    from urllib.parse import quote
    encoded_name = quote("마감재일람표.xlsx", safe="")
    headers = {
        "Content-Disposition": f"attachment; filename=\"schedule.xlsx\"; filename*=UTF-8''{encoded_name}",
        "X-Unresolved-Codes": ",".join(unresolved),
    }
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.post("/import")
async def import_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Excel 파일(.xlsx/.xls)만 업로드 가능합니다.")
    content = await file.read()
    try:
        rows = parse_import(content)
    except Exception as e:
        raise HTTPException(422, f"파싱 오류: {e}")
    return {"rows": rows, "count": len(rows)}
