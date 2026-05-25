import { useEffect, useState, useRef } from "react"
import type { Room, FinishRow, RoomCreate } from "../types"
import { EMPTY_FINISH } from "../types"
import { getRooms, clearRooms, bulkCreateRooms, importSchedule } from "../api/client"
import RoomEditor from "../components/RoomEditor"
import SchedulePreview from "../components/SchedulePreview"
import toast from "react-hot-toast"
import { Upload, Trash2 } from "lucide-react"

export default function SchedulePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRooms().then(setRooms).catch(() => {})
  }, [])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    try {
      const rows: FinishRow[] = await importSchedule(file)
      const creates: RoomCreate[] = rows
        .filter(r => r.name)
        .map(r => ({
          name: r.name,
          purpose: r.purpose,
          floor_level: r.floor_level,
          finishes: {
            floor: r.floor || "",
            wall: r.wall || "",
            ceiling: r.ceiling || "",
            skirting: r.skirting || "",
            paint: r.paint || "",
          },
        }))
      const created = await bulkCreateRooms(creates)
      setRooms(prev => [...prev, ...created])
      toast.success(`${created.length}개 실 임포트 완료`)
    } catch {
      toast.error("임포트 실패. Excel 양식을 확인하세요.")
    }
  }

  const handleClear = async () => {
    if (!confirm("모든 실을 삭제하시겠습니까?")) return
    try {
      await clearRooms()
      setRooms([])
      toast.success("전체 삭제됨")
    } catch {
      toast.error("삭제 실패")
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* 툴바 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["edit", "preview"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "edit" ? "실 편집" : "미리보기 / 내보내기"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 border px-3 py-1.5 rounded text-sm hover:bg-gray-50"
          >
            <Upload size={14} /> Excel 임포트
          </button>
          {rooms.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 border border-red-200 text-red-500 px-3 py-1.5 rounded text-sm hover:bg-red-50"
            >
              <Trash2 size={14} /> 전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 임포트 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
        Excel 임포트 양식 헤더: <strong>층 / 실명 / 용도 / 바닥코드 / 벽코드 / 천장코드 / 걸레받이코드 / 도장코드</strong>
      </div>

      {tab === "edit" ? (
        <RoomEditor rooms={rooms} onRoomsChange={setRooms} />
      ) : (
        <SchedulePreview rooms={rooms} />
      )}
    </div>
  )
}
