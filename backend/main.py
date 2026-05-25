from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import materials, rooms, schedule

app = FastAPI(
    title="마감재 일람표 정리기",
    version="1.0.0",
    description="실·마감 코드 입력 → 표준 Excel 일람표 자동 생성",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router)
app.include_router(rooms.router)
app.include_router(schedule.router)


@app.get("/health")
def health():
    return {"status": "ok"}
