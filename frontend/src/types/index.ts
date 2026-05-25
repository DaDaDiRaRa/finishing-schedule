export type Category = "바닥" | "벽" | "천장" | "걸레받이" | "도장"

export interface Material {
  code: string
  name: string
  manufacturer: string
  spec: string
  unit: string
  note: string
  category: Category
}

export interface RoomFinish {
  floor: string      // 바닥 코드
  wall: string       // 벽 코드
  ceiling: string    // 천장 코드
  skirting: string   // 걸레받이 코드
  paint: string      // 도장 코드
}

export interface Room {
  id: string
  name: string
  purpose: string
  floor_level: string
  finishes: RoomFinish
}

export interface RoomCreate {
  name: string
  purpose: string
  floor_level: string
  finishes: RoomFinish
}

export interface FinishRow {
  floor_level: string
  name: string
  purpose: string
  floor: string
  wall: string
  ceiling: string
  skirting: string
  paint: string
}

export const EMPTY_FINISH: RoomFinish = {
  floor: "",
  wall: "",
  ceiling: "",
  skirting: "",
  paint: "",
}

export const FINISH_LABELS: { key: keyof RoomFinish; label: string }[] = [
  { key: "floor",    label: "바닥" },
  { key: "wall",     label: "벽" },
  { key: "ceiling",  label: "천장" },
  { key: "skirting", label: "걸레받이" },
  { key: "paint",    label: "도장" },
]
