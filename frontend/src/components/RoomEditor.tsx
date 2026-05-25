import { useState } from "react"
import type { Room, RoomCreate } from "../types"
import { EMPTY_FINISH } from "../types"
import { createRoom, deleteRoom, updateRoom } from "../api/client"
import toast from "react-hot-toast"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import MaterialInput from "./MaterialInput"

interface Props {
  rooms: Room[]
  onRoomsChange: (rooms: Room[]) => void
}

const FLOORS = ["B3", "B2", "B1", "1F", "2F", "3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "RF"]

export default function RoomEditor({ rooms, onRoomsChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newRoom, setNewRoom] = useState<Omit<RoomCreate, "finishes">>({
    name: "", purpose: "", floor_level: "1F",
  })

  const handleAdd = async () => {
    if (!newRoom.name.trim()) { toast.error("실 이름을 입력하세요."); return }
    try {
      const created = await createRoom({ ...newRoom, finishes: { ...EMPTY_FINISH } })
      onRoomsChange([...rooms, created])
      setNewRoom(prev => ({ ...prev, name: "", purpose: "" }))
      toast.success(`'${created.name}' 추가됨`)
    } catch {
      toast.error("추가 실패")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}'을(를) 삭제하시겠습니까?`)) return
    try {
      await deleteRoom(id)
      onRoomsChange(rooms.filter(r => r.id !== id))
      toast.success("삭제됨")
    } catch {
      toast.error("삭제 실패")
    }
  }

  const handleFinishChange = async (room: Room, updated: Room) => {
    try {
      const saved = await updateRoom(room.id, { finishes: updated.finishes })
      onRoomsChange(rooms.map(r => r.id === saved.id ? saved : r))
    } catch {
      toast.error("저장 실패")
    }
  }

  const sorted = [...rooms].sort((a, b) =>
    a.floor_level.localeCompare(b.floor_level) || a.name.localeCompare(b.name)
  )

  return (
    <div className="space-y-4">
      {/* 새 실 추가 폼 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">새 실 추가</h3>
        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={newRoom.floor_level}
            onChange={e => setNewRoom(p => ({ ...p, floor_level: e.target.value }))}
          >
            {FLOORS.map(f => <option key={f}>{f}</option>)}
          </select>
          <input
            className="border rounded px-2 py-1.5 text-sm flex-1 min-w-32"
            placeholder="실 이름 (예: 로비)"
            value={newRoom.name}
            onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <input
            className="border rounded px-2 py-1.5 text-sm flex-1 min-w-24"
            placeholder="용도 (예: 공용)"
            value={newRoom.purpose}
            onChange={e => setNewRoom(p => ({ ...p, purpose: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
      </div>

      {/* 실 목록 */}
      {sorted.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">실을 추가해 주세요.</p>
      )}
      {sorted.map(room => (
        <div key={room.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedId(expandedId === room.id ? null : room.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                {room.floor_level}
              </span>
              <span className="font-medium text-gray-800">{room.name}</span>
              {room.purpose && (
                <span className="text-xs text-gray-400">{room.purpose}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); handleDelete(room.id, room.name) }}
                className="text-red-400 hover:text-red-600 p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
              {expandedId === room.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {expandedId === room.id && (
            <div className="border-t px-4 py-3 bg-gray-50">
              <MaterialInput
                room={room}
                onChange={updated => handleFinishChange(room, updated)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
