import { useEffect, useState, useCallback } from "react"
import type { Room, RoomFinish, Material } from "../types"
import { FINISH_LABELS } from "../types"
import { lookupCodes } from "../api/client"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface Props {
  room: Room
  onChange: (updated: Room) => void
}

type CodeStatus = "idle" | "ok" | "warn"

interface FieldState {
  status: CodeStatus
  material: Material | null
}

export default function MaterialInput({ room, onChange }: Props) {
  const [finishes, setFinishes] = useState<RoomFinish>({ ...room.finishes })
  const [statuses, setStatuses] = useState<Record<string, FieldState>>({})

  const validate = useCallback(async (current: RoomFinish) => {
    const codes = Object.values(current).filter(Boolean)
    if (codes.length === 0) return
    const result = await lookupCodes(codes)
    const next: Record<string, FieldState> = {}
    for (const [key, code] of Object.entries(current) as [keyof RoomFinish, string][]) {
      if (!code) { next[key] = { status: "idle", material: null }; continue }
      const mat = result[code] ?? null
      next[key] = { status: mat ? "ok" : "warn", material: mat }
    }
    setStatuses(next)
  }, [])

  useEffect(() => { validate(finishes) }, [])

  const handleChange = (key: keyof RoomFinish, value: string) => {
    const next = { ...finishes, [key]: value.toUpperCase().trim() }
    setFinishes(next)
    onChange({ ...room, finishes: next })
  }

  const handleBlur = () => validate(finishes)

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">공종별 마감 코드를 입력하세요 (예: FL-OAK-01)</p>
      {FINISH_LABELS.map(({ key, label }) => {
        const state = statuses[key]
        const code = finishes[key]
        return (
          <div key={key} className="flex items-start gap-2">
            <span className="text-xs w-16 pt-2 text-gray-600 shrink-0">{label}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <input
                  className={`border rounded px-2 py-1.5 text-sm font-mono w-36
                    ${state?.status === "warn" ? "border-yellow-400 bg-yellow-50" : ""}
                    ${state?.status === "ok" ? "border-green-400" : ""}
                  `}
                  placeholder="코드 입력"
                  value={code}
                  onChange={e => handleChange(key, e.target.value)}
                  onBlur={handleBlur}
                />
                {state?.status === "ok" && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                {state?.status === "warn" && <AlertTriangle size={14} className="text-yellow-500 shrink-0" />}
              </div>
              {state?.material && (
                <p className="text-xs text-gray-500 mt-0.5 pl-1">
                  {state.material.name} · {state.material.manufacturer} · {state.material.spec}
                </p>
              )}
              {state?.status === "warn" && code && (
                <p className="text-xs text-yellow-600 mt-0.5 pl-1">⚠ 미등록 코드</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
