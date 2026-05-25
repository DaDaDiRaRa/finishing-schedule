import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import SchedulePage from "./pages/SchedulePage"
import DatabasePage from "./pages/DatabasePage"
import { FileSpreadsheet, Database } from "lucide-react"

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-blue-900 text-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg tracking-tight">마감재 일람표 정리기</h1>
              <p className="text-blue-300 text-xs mt-0.5">실·마감 코드 입력 → 표준 Excel 일람표 자동 생성</p>
            </div>
            <nav className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors
                  ${isActive ? "bg-white text-blue-900 font-medium" : "text-blue-200 hover:bg-blue-800"}`
                }
              >
                <FileSpreadsheet size={15} /> 일람표 작성
              </NavLink>
              <NavLink
                to="/db"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors
                  ${isActive ? "bg-white text-blue-900 font-medium" : "text-blue-200 hover:bg-blue-800"}`
                }
              >
                <Database size={15} /> DB 관리
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="py-6">
          <Routes>
            <Route path="/" element={<SchedulePage />} />
            <Route path="/db" element={<DatabasePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
