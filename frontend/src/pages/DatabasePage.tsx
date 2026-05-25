import { useEffect, useState } from "react"
import type { Material, Category } from "../types"
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from "../api/client"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Search, X, Check } from "lucide-react"

const CATEGORIES: Category[] = ["바닥", "벽", "천장", "걸레받이", "도장"]
const CATEGORY_COLORS: Record<Category, string> = {
  "바닥":    "bg-amber-100 text-amber-800",
  "벽":      "bg-blue-100 text-blue-800",
  "천장":    "bg-purple-100 text-purple-800",
  "걸레받이": "bg-teal-100 text-teal-800",
  "도장":    "bg-pink-100 text-pink-800",
}

const EMPTY_MAT = (): Omit<Material, "code"> => ({
  name: "", manufacturer: "", spec: "", unit: "㎡", note: "", category: "바닥",
})

export default function DatabasePage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [q, setQ] = useState("")
  const [filterCat, setFilterCat] = useState<Category | "전체">("전체")
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Omit<Material, "code">>(EMPTY_MAT())
  const [newCode, setNewCode] = useState("")
  const [newForm, setNewForm] = useState<Omit<Material, "code">>(EMPTY_MAT())
  const [showAdd, setShowAdd] = useState(false)

  const load = async (query = q) => {
    const data = await getMaterials(query)
    setMaterials(data)
  }

  useEffect(() => { load() }, [])

  const filtered = materials.filter(m =>
    filterCat === "전체" || m.category === filterCat
  )

  const startEdit = (m: Material) => {
    setEditingCode(m.code)
    setEditForm({ name: m.name, manufacturer: m.manufacturer, spec: m.spec, unit: m.unit, note: m.note, category: m.category })
  }

  const saveEdit = async (code: string) => {
    try {
      const updated = await updateMaterial(code, editForm)
      setMaterials(prev => prev.map(m => m.code === code ? updated : m))
      setEditingCode(null)
      toast.success("저장됨")
    } catch { toast.error("저장 실패") }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`'${code}'을(를) 삭제하시겠습니까?`)) return
    try {
      await deleteMaterial(code)
      setMaterials(prev => prev.filter(m => m.code !== code))
      toast.success("삭제됨")
    } catch { toast.error("삭제 실패") }
  }

  const handleAdd = async () => {
    if (!newCode.trim() || !newForm.name.trim()) { toast.error("코드와 재료명을 입력하세요."); return }
    try {
      const created = await createMaterial(newCode.trim().toUpperCase(), newForm)
      setMaterials(prev => [...prev, created])
      setNewCode("")
      setNewForm(EMPTY_MAT())
      setShowAdd(false)
      toast.success("추가됨")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "추가 실패")
    }
  }

  const Field = ({ label, value, onChange, wide = false }: any) => (
    <td className="px-1 py-0.5">
      <input
        className={`border rounded px-1.5 py-0.5 text-xs ${wide ? "w-40" : "w-24"}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </td>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-gray-700">마감재 DB 관리 ({filtered.length}개)</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          <Plus size={14} /> 새 마감재 추가
        </button>
      </div>

      {/* 검색·필터 */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            className="border rounded pl-8 pr-3 py-1.5 text-sm w-full"
            placeholder="코드·재료명·제조사 검색"
            value={q}
            onChange={e => { setQ(e.target.value); load(e.target.value) }}
          />
        </div>
        <div className="flex gap-1">
          {(["전체", ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium border
                ${filterCat === cat ? "bg-gray-800 text-white border-gray-800" : "hover:bg-gray-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">새 마감재 추가</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {[
              { label: "코드 *", value: newCode, set: setNewCode, mono: true },
              { label: "재료명 *", value: newForm.name, set: (v: string) => setNewForm(p => ({ ...p, name: v })) },
              { label: "제조사", value: newForm.manufacturer, set: (v: string) => setNewForm(p => ({ ...p, manufacturer: v })) },
              { label: "규격", value: newForm.spec, set: (v: string) => setNewForm(p => ({ ...p, spec: v })) },
              { label: "단위", value: newForm.unit, set: (v: string) => setNewForm(p => ({ ...p, unit: v })) },
              { label: "비고", value: newForm.note, set: (v: string) => setNewForm(p => ({ ...p, note: v })) },
            ].map(({ label, value, set, mono }) => (
              <div key={label}>
                <label className="text-xs text-gray-600">{label}</label>
                <input
                  className={`border rounded px-2 py-1 text-sm w-full mt-0.5 ${mono ? "font-mono" : ""}`}
                  value={value}
                  onChange={e => set(e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600">공종 *</label>
              <select
                className="border rounded px-2 py-1 text-sm w-full mt-0.5"
                value={newForm.category}
                onChange={e => setNewForm(p => ({ ...p, category: e.target.value as Category }))}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
              <Check size={14} /> 저장
            </button>
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1 border px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <X size={14} /> 취소
            </button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-auto rounded border">
        <table className="w-full text-xs">
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              {["코드", "공종", "재료명", "제조사", "규격", "단위", "비고", ""].map(h => (
                <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.code} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                {editingCode === m.code ? (
                  <>
                    <td className="px-2 py-1 font-mono text-blue-700">{m.code}</td>
                    <td className="px-1 py-0.5">
                      <select className="border rounded px-1 py-0.5 text-xs" value={editForm.category}
                        onChange={e => setEditForm(p => ({ ...p, category: e.target.value as Category }))}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <Field label="재료명" value={editForm.name} onChange={(v: string) => setEditForm(p => ({ ...p, name: v }))} wide />
                    <Field label="제조사" value={editForm.manufacturer} onChange={(v: string) => setEditForm(p => ({ ...p, manufacturer: v }))} />
                    <Field label="규격" value={editForm.spec} onChange={(v: string) => setEditForm(p => ({ ...p, spec: v }))} wide />
                    <Field label="단위" value={editForm.unit} onChange={(v: string) => setEditForm(p => ({ ...p, unit: v }))} />
                    <Field label="비고" value={editForm.note} onChange={(v: string) => setEditForm(p => ({ ...p, note: v }))} wide />
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(m.code)} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
                        <button onClick={() => setEditingCode(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 font-mono text-blue-700 whitespace-nowrap">{m.code}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[m.category]}`}>{m.category}</span>
                    </td>
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-gray-500">{m.manufacturer}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-48 truncate">{m.spec}</td>
                    <td className="px-3 py-2 text-center">{m.unit}</td>
                    <td className="px-3 py-2 text-gray-400">{m.note}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(m)} className="text-blue-400 hover:text-blue-600 p-0.5"><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(m.code)} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
