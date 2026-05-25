import axios from "axios"
import type { Material, Room, RoomCreate, FinishRow } from "../types"

const api = axios.create({ baseURL: "/api" })

// ── 마감재 DB ─────────────────────────────────────────────
export const getMaterials = (q = "") =>
  api.get<Material[]>("/materials/", { params: q ? { q } : {} }).then(r => r.data)

export const getMaterial = (code: string) =>
  api.get<Material>(`/materials/${code}`).then(r => r.data)

export const createMaterial = (code: string, data: Omit<Material, "code">) =>
  api.post<Material>("/materials/", data, { params: { code } }).then(r => r.data)

export const updateMaterial = (code: string, data: Partial<Omit<Material, "code">>) =>
  api.put<Material>(`/materials/${code}`, data).then(r => r.data)

export const deleteMaterial = (code: string) =>
  api.delete(`/materials/${code}`)

export const lookupCodes = (codes: string[]) =>
  api.post<Record<string, Material | null>>("/materials/lookup", codes).then(r => r.data)

// ── 실 목록 ───────────────────────────────────────────────
export const getRooms = () =>
  api.get<Room[]>("/rooms/").then(r => r.data)

export const createRoom = (data: RoomCreate) =>
  api.post<Room>("/rooms/", data).then(r => r.data)

export const updateRoom = (id: string, data: Partial<RoomCreate>) =>
  api.put<Room>(`/rooms/${id}`, data).then(r => r.data)

export const deleteRoom = (id: string) =>
  api.delete(`/rooms/${id}`)

export const clearRooms = () =>
  api.delete("/rooms/")

export const bulkCreateRooms = (data: RoomCreate[]) =>
  api.post<Room[]>("/rooms/bulk", data).then(r => r.data)

// ── 일람표 ────────────────────────────────────────────────
export const exportSchedule = async (rooms: Room[]): Promise<void> => {
  const res = await api.post("/schedule/export", rooms, { responseType: "blob" })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement("a")
  a.href = url
  a.download = "마감재일람표.xlsx"
  a.click()
  URL.revokeObjectURL(url)
}

export const importSchedule = async (file: File): Promise<FinishRow[]> => {
  const form = new FormData()
  form.append("file", file)
  const res = await api.post<{ rows: FinishRow[]; count: number }>(
    "/schedule/import", form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return res.data.rows
}
