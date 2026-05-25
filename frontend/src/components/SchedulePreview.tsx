import { useEffect, useState } from "react"
import type { Room, Material } from "../types"
import { FINISH_LABELS } from "../types"
import { lookupCodes } from "../api/client"
import { exportSchedule } from "../api/client"
import { Download, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface Props {
  rooms: Room[]
}

interface PreviewRow {
  floor_level: string
  name: string
  purpose: string
  finishLabel: string
  code: string
  material: Material | null
  isUnknown: boolean
}

export default function SchedulePreview({ rooms }: Props) {
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (rooms.length === 0) { setRows([]); return }
    buildPreview()
  }, [rooms])

  const buildPreview = async () => {
    setLoading(true)
    const allCodes = rooms.flatMap(r => Object.values(r.finishes)).filter(Boolean)
    const uniqueCodes = [...new Set(allCodes)]
    const lookup = uniqueCodes.length > 0 ? await lookupCodes(uniqueCodes) : {}

    const result: PreviewRow[] = []
    const sorted = [...rooms].sort((a, b) =>
      a.floor_level.localeCompare(b.floor_level) || a.name.localeCompare(b.name)
    )

    for (const room of sorted) {
      for (const { key, label } of FINISH_LABELS) {
        const code = room.finishes[key]
        if (!code) continue
        const material = lookup[code] ?? null
        result.push({
          floor_level: room.floor_level,
          name: room.name,
          purpose: room.purpose,
          finishLabel: label,
          code,
          material,
          isUnknown: material === null,
        })
      }
    }
    setRows(result)
    setLoading(false)
  }

  const handleExport = async () => {
    if (rooms.length === 0) { toast.error("실 목록이 비어 있습니다."); return }
    setExporting(true)
    try {
      await exportSchedule(rooms)
      toast.success("Excel 다운로드 완료")
    } catch {
      toast.error("내보내기 실패")
    } finally {
      setExporting(false)
    }
  }

  const unknownCodes = [...new Set(rows.filter(r => r.isUnknown).map(r => r.code))]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">미리보기 ({rows.length}행)</h2>
        <button
          onClick={handleExport}
          disabled={exporting || rooms.length === 0}
          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? "생성 중…" : "Excel 내보내기"}
        </button>
      </div>

      {unknownCodes.length > 0 && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>미등록 코드: <strong>{unknownCodes.join(", ")}</strong> — Excel에서 황색으로 표시됩니다.</span>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">마감 코드를 입력하면 여기에 미리보기가 나타납니다.</p>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="w-full text-xs">
            <thead className="bg-blue-900 text-white sticky top-0">
              <tr>
                {["층", "실명", "용도", "공종", "코드", "재료명", "제조사", "규격", "단위", "비고"].map(h => (
                  <th key={h} className="px-2 py-2 text-left whitespace-nowrap font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t ${row.isUnknown ? "bg-yellow-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="px-2 py-1.5 font-mono">{row.floor_level}</td>
                  <td className="px-2 py-1.5 font-medium">{row.name}</td>
                  <td className="px-2 py-1.5 text-gray-500">{row.purpose}</td>
                  <td className="px-2 py-1.5">{row.finishLabel}</td>
                  <td className="px-2 py-1.5 font-mono text-blue-700">{row.code}</td>
                  {row.material ? (
                    <>
                      <td className="px-2 py-1.5">{row.material.name}</td>
                      <td className="px-2 py-1.5 text-gray-500">{row.material.manufacturer}</td>
                      <td className="px-2 py-1.5 text-gray-500 max-w-48 truncate">{row.material.spec}</td>
                      <td className="px-2 py-1.5 text-center">{row.material.unit}</td>
                      <td className="px-2 py-1.5 text-gray-400">{row.material.note}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-2 py-1.5 text-yellow-700 font-medium">
                      ⚠ 미등록 코드
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
