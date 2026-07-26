import React, { useState } from "react";
import { GradedSheet, Exam } from "../types";
import { BarChart3, Download, Search, Filter, TrendingUp, AlertTriangle, CheckCircle2, FileSpreadsheet, UserCheck } from "lucide-react";
import * as XLSX from "xlsx";

interface AnalyticsViewProps {
  gradedSheets: GradedSheet[];
  exams: Exam[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  gradedSheets,
  exams,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter sheets
  const filteredSheets = gradedSheets.filter((sheet) => {
    const matchExam = selectedExamId === "all" || sheet.examId === selectedExamId;
    const matchClass = selectedClass === "all" || sheet.gradeClass === selectedClass;
    const matchSearch =
      sheet.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchExam && matchClass && matchSearch;
  });

  // Calculate statistics
  const totalGraded = filteredSheets.length;
  const avgScore =
    totalGraded > 0
      ? (filteredSheets.reduce((acc, curr) => acc + curr.score, 0) / totalGraded).toFixed(2)
      : "0.00";

  const gioicount = filteredSheets.filter((s) => s.score >= 8.0).length;
  const khaCount = filteredSheets.filter((s) => s.score >= 6.5 && s.score < 8.0).length;
  const tbCount = filteredSheets.filter((s) => s.score >= 5.0 && s.score < 6.5).length;
  const yeuCount = filteredSheets.filter((s) => s.score < 5.0).length;

  // Export Excel File
  const handleExportExcel = () => {
    const excelData = filteredSheets.map((s, idx) => ({
      STT: idx + 1,
      "Số Báo Danh": s.studentId,
      "Họ Và Tên": s.studentName,
      "Lớp Học": s.gradeClass,
      "Bài Kiểm Tra": s.examTitle,
      "Mã Đề": s.examCode,
      "Số Câu Đúng": `${s.correctCount}/${s.totalQuestions}`,
      "Điểm Số": s.score,
      "Xếp Loại": s.score >= 8.0 ? "Giỏi" : s.score >= 6.5 ? "Khá" : s.score >= 5.0 ? "Trung Bình" : "Yếu/Kém",
      "Ngày Chấm": s.scannedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangDiemEduMark");
    XLSX.writeFile(workbook, `So_Diem_EduMark_AI_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Sổ Điểm Lớp & Phân Tích Phổ Điểm AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp kết quả chấm bài, thống kê chất lượng học tập và xuất sổ điểm Excel chuẩn Bộ GD&ĐT.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Sổ Điểm Excel</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400">Tổng Bài Đã Chấm</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalGraded} Bài</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400">Điểm Trung Bình</p>
          <h3 className="text-2xl font-black text-indigo-600 mt-1">{avgScore} / 10</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-600 font-bold">Giỏi (≥ 8.0)</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {gioicount} <span className="text-xs text-slate-400">({totalGraded > 0 ? Math.round((gioicount/totalGraded)*100) : 0}%)</span>
          </h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-600 font-bold">Khá (6.5 - 7.9)</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">
            {khaCount} <span className="text-xs text-slate-400">({totalGraded > 0 ? Math.round((khaCount/totalGraded)*100) : 0}%)</span>
          </h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-600 font-bold">TB & Yếu (&lt; 6.5)</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {tbCount + yeuCount}
          </h3>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, SBD..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-indigo-600"
            />
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="all">Tất cả bài thi</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">Hiển thị {filteredSheets.length} kết quả</span>
      </div>

      {/* Gradebook Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SBD</th>
                <th className="py-3 px-4">Họ & Tên Học Sinh</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Mã Đề</th>
                <th className="py-3 px-4">Bài Kiểm Tra</th>
                <th className="py-3 px-4">Số Câu Đúng</th>
                <th className="py-3 px-4">Điểm Số</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Thời Gian Chấm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredSheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sheet.studentId}</td>
                  <td className="py-3 px-4 font-bold">{sheet.studentName}</td>
                  <td className="py-3 px-4">{sheet.gradeClass}</td>
                  <td className="py-3 px-4 font-mono">{sheet.examCode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600 max-w-xs truncate">
                    {sheet.examTitle}
                  </td>
                  <td className="py-3 px-4">
                    {sheet.correctCount} / {sheet.totalQuestions}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-black text-sm ${
                        sheet.score >= 8.0
                          ? "text-emerald-600"
                          : sheet.score >= 5.0
                          ? "text-indigo-600"
                          : "text-red-600"
                      }`}
                    >
                      {sheet.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sheet.status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sheet.status === "verified" ? "Đã duyệt" : "Cảnh báo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{sheet.scannedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
