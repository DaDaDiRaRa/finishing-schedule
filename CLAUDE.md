# 마감재 일람표 정리기

## 프로젝트 개요
실 이름·마감 코드 입력 → 사내 마감재 DB 조회 → 표준 Excel 일람표 자동 생성.
AI API 없음. 순수 Python + openpyxl.

## 기술 스택
- **Backend**: FastAPI, Python 3.11, openpyxl, pandas
- **Frontend**: React 18, TypeScript, Vite
- **Container**: Docker + docker-compose
- **배포**: GCP Cloud Run

## 폴더 구조
```
finishing-schedule/
├── backend/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── data/
│   │   └── materials_db.json  # 마감재 DB (코드 → 재료 정보)
│   ├── models/
│   │   ├── room.py          # Room, RoomFinish Pydantic 모델
│   │   └── material.py      # Material Pydantic 모델
│   ├── routers/
│   │   ├── rooms.py         # 실 CRUD
│   │   ├── materials.py     # DB 관리 (추가·수정·삭제)
│   │   └── schedule.py      # Excel 생성·임포트
│   └── services/
│       ├── material_mapper.py    # 코드 → DB 매핑 로직
│       └── schedule_generator.py # openpyxl 일람표 생성
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── types/index.ts
        ├── api/client.ts
        ├── components/
        │   ├── RoomEditor.tsx       # 실 목록 입력
        │   ├── MaterialInput.tsx    # 공종별 마감 코드 입력
        │   └── SchedulePreview.tsx  # 미리보기 + 경고
        └── pages/
            ├── SchedulePage.tsx
            └── DatabasePage.tsx
```

## 개발 실행
```bash
# 백엔드
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# 프론트엔드
cd frontend && npm install && npm run dev

# Docker
docker-compose up --build
```

## 데이터 모델
- **materials_db.json**: `{ "코드": { name, manufacturer, spec, unit, note, category } }`
- **Room**: id, name, purpose, floor, finishes(바닥/벽/천장/걸레받이/도장)
- **Excel 출력**: 층-실-공종별 표준 행 배치, 미등록 코드 황색 하이라이트

## 주의
- AI API 호출 금지
- DB는 JSON 파일 기반 (SQLite 전환 가능하지만 현재는 JSON)
- Excel 임포트 시 pandas로 파싱 → 코드 매핑 후 프리뷰 반환
