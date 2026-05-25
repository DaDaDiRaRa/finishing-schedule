"""openpyxl 기반 마감재 일람표 Excel 생성 서비스."""
import io
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, colors
)
from openpyxl.utils import get_column_letter

from models.room import Room
from services.material_mapper import get_by_code

# 컬럼 정의: (헤더명, 열너비)
COLUMNS = [
    ("층", 6),
    ("실명", 14),
    ("용도", 10),
    ("공종", 8),
    ("마감코드", 14),
    ("재료명", 22),
    ("제조사", 14),
    ("규격", 26),
    ("단위", 6),
    ("비고", 20),
]

FINISH_KEYS = [
    ("바닥", "floor"),
    ("벽", "wall"),
    ("천장", "ceiling"),
    ("걸레받이", "skirting"),
    ("도장", "paint"),
]

# 스타일 상수
HEADER_FILL = PatternFill("solid", fgColor="1F3864")
HEADER_FONT = Font(bold=True, color="FFFFFF", size=10)
SUB_HEADER_FILL = PatternFill("solid", fgColor="D6E4F0")
ALT_FILL = PatternFill("solid", fgColor="F5F5F5")
WARN_FILL = PatternFill("solid", fgColor="FFE066")   # 미등록 코드 경고
THIN = Side(style="thin", color="AAAAAA")
THIN_BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)


def _apply_border(ws, min_row, max_row, min_col, max_col):
    for row in ws.iter_rows(min_row=min_row, max_row=max_row,
                             min_col=min_col, max_col=max_col):
        for cell in row:
            cell.border = THIN_BORDER


def generate(rooms: list[Room]) -> tuple[bytes, list[str]]:
    """
    Excel 바이트를 반환하고 미등록 코드 목록도 함께 반환.
    Returns: (xlsx_bytes, unresolved_codes)
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "마감재 일람표"

    # 제목 행
    ws.merge_cells("A1:J1")
    title_cell = ws["A1"]
    title_cell.value = "마감재 일람표"
    title_cell.font = Font(bold=True, size=14, color="1F3864")
    title_cell.alignment = CENTER
    ws.row_dimensions[1].height = 30

    # 헤더 행 (2행)
    for col_idx, (header, width) in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=2, column=col_idx, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = CENTER
        cell.border = THIN_BORDER
        ws.column_dimensions[get_column_letter(col_idx)].width = width
    ws.row_dimensions[2].height = 22

    current_row = 3
    unresolved: list[str] = []
    sorted_rooms = sorted(rooms, key=lambda r: (r.floor_level, r.name))
    row_counter = 0

    for room in sorted_rooms:
        finish_rows = []
        for label, attr in FINISH_KEYS:
            code = getattr(room.finishes, attr, "")
            if not code:
                continue
            material = get_by_code(code)
            is_unknown = material is None
            if is_unknown and code not in unresolved:
                unresolved.append(code)
            finish_rows.append((label, code, material, is_unknown))

        if not finish_rows:
            # 마감 코드 없어도 실 행은 표시
            finish_rows = [("", "", None, False)]

        start_row = current_row
        for i, (label, code, material, is_unknown) in enumerate(finish_rows):
            row_counter += 1
            fill = ALT_FILL if row_counter % 2 == 0 else None

            def _cell(col, value, align=LEFT):
                c = ws.cell(row=current_row, column=col, value=value)
                c.alignment = align
                c.border = THIN_BORDER
                if is_unknown and col >= 5:
                    c.fill = WARN_FILL
                elif fill:
                    c.fill = fill
                return c

            if i == 0:
                _cell(1, room.floor_level, CENTER)
                _cell(2, room.name)
                _cell(3, room.purpose)
            else:
                for col in (1, 2, 3):
                    c = ws.cell(row=current_row, column=col)
                    c.border = THIN_BORDER
                    if fill:
                        c.fill = fill

            _cell(4, label, CENTER)
            _cell(5, code, CENTER)
            if material:
                _cell(6, material.name)
                _cell(7, material.manufacturer, CENTER)
                _cell(8, material.spec)
                _cell(9, material.unit, CENTER)
                _cell(10, material.note)
            else:
                for col in range(6, 11):
                    c = ws.cell(row=current_row, column=col)
                    c.border = THIN_BORDER
                    if is_unknown:
                        c.fill = WARN_FILL
                        if col == 6:
                            c.value = "⚠ 미등록 코드"
                    elif fill:
                        c.fill = fill

            ws.row_dimensions[current_row].height = 18
            current_row += 1

        # 실 이름·층·용도를 세로 병합
        if len(finish_rows) > 1:
            end_row = current_row - 1
            for col in (1, 2, 3):
                ws.merge_cells(
                    start_row=start_row, start_column=col,
                    end_row=end_row, end_column=col
                )
                ws.cell(row=start_row, column=col).alignment = CENTER

    # 미등록 경고 범례 (하단)
    if unresolved:
        ws.cell(row=current_row + 1, column=1,
                value="⚠ 황색 행 = 미등록 코드: " + ", ".join(unresolved))
        ws.cell(row=current_row + 1, column=1).font = Font(color="CC0000", italic=True)
        ws.merge_cells(
            start_row=current_row + 1, start_column=1,
            end_row=current_row + 1, end_column=10
        )

    # 열 고정 (2행 헤더까지)
    ws.freeze_panes = "A3"

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue(), unresolved


def parse_import(file_bytes: bytes) -> list[dict]:
    """
    Excel 임포트: pandas로 파싱 → 코드 매핑 결과 반환.
    예상 컬럼: 층, 실명, 용도, 바닥코드, 벽코드, 천장코드, 걸레받이코드, 도장코드
    """
    import pandas as pd

    df = pd.read_excel(io.BytesIO(file_bytes), header=0)
    df.columns = [str(c).strip() for c in df.columns]

    col_map = {
        "층": "floor_level",
        "실명": "name",
        "용도": "purpose",
        "바닥코드": "floor",
        "벽코드": "wall",
        "천장코드": "ceiling",
        "걸레받이코드": "skirting",
        "도장코드": "paint",
    }

    rows = []
    for _, row in df.iterrows():
        item = {}
        for kr, en in col_map.items():
            val = row.get(kr, "")
            item[en] = "" if (val != val or val is None) else str(val).strip()
        rows.append(item)
    return rows
