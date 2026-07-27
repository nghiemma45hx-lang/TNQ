import React, { useState } from "react";
import { Exam } from "../types";
import { Plus, Edit3, Trash2, Key, Printer, CheckCircle, FileSpreadsheet, Copy, Sparkles, Save, HelpCircle, ArrowLeft, Check, Link, Type } from "lucide-react";

interface ExamManagerProps {
  exams: Exam[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onOpenPrintSheet: (exam: Exam) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  onSaveExam,
  onDeleteExam,
  onOpenPrintSheet,
}) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(exams[0] || null);
  const [activeCode, setActiveCode] = useState<string>("101");
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [pasteKeyText, setPasteKeyText] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Đã lưu đáp án thành công!");

  // New Exam Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Khoa học Tự nhiên");
  const [newGrade, setNewGrade] = useState("Khối 8");
  const [newQuestionCount, setNewQuestionCount] = useState<number>(40);
  const [newDuration, setNewDuration] = useState<number>(45);

  // Edit Exam Form State
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editQuestionCount, setEditQuestionCount] = useState<number>(40);
  const [editDuration, setEditDuration] = useState<number>(45);

  const triggerSaveToast = (msg = "Đã lưu thành công!") => {
    setToastMessage(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  const handleOpenEditModal = () => {
    if (!selectedExam) return;
    setEditTitle(selectedExam.title);
    setEditSubject(selectedExam.subject);
    setEditGrade(selectedExam.gradeClass);
    setEditQuestionCount(selectedExam.questionCount);
    setEditDuration(selectedExam.durationMinutes);
    setShowEditExamModal(true);
  };

  const handleSaveEditExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !editTitle.trim()) return;

    // Handle question count changes across all exam codes
    const newKeysMap: Record<string, Record<number, string>> = {};
    const options = ["A", "B", "C", "D"];

    Object.entries(selectedExam.examKeys).forEach(([code, keys]) => {
      const updatedKeys: Record<number, string> = {};
      for (let i = 1; i <= editQuestionCount; i++) {
        if (keys[i]) {
          updatedKeys[i] = keys[i];
        } else {
          updatedKeys[i] = options[(i - 1) % 4];
        }
      }
      newKeysMap[code] = updatedKeys;
    });

    const updatedExam: Exam = {
      ...selectedExam,
      title: editTitle.trim(),
      subject: editSubject,
      gradeClass: editGrade,
      questionCount: editQuestionCount,
      durationMinutes: editDuration,
      examKeys: newKeysMap,
    };

    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    setShowEditExamModal(false);
    triggerSaveToast("Đã cập nhật thông tin bài thi & số câu hỏi!");
  };

  const handleCreateNewExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Generate default answer keys for code 101
    const defaultKeys101: Record<number, string> = {};
    const options = ["A", "B", "C", "D"];

    for (let i = 1; i <= newQuestionCount; i++) {
      defaultKeys101[i] = options[(i - 1) % 4];
    }

    const created: Exam = {
      id: "EX-" + Date.now().toString(36).toUpperCase(),
      title: newTitle.trim(),
      subject: newSubject,
      gradeClass: newGrade,
      questionCount: newQuestionCount,
      durationMinutes: newDuration,
      createdAt: new Date().toISOString().split("T")[0],
      status: "active",
      examKeys: {
        "101": defaultKeys101,
      },
    };

    onSaveExam(created);
    setSelectedExam(created);
    setActiveCode("101");
    setShowNewExamModal(false);
    setNewTitle("");
  };

  const handleUpdateAnswerKey = (questionNum: number, choice: string) => {
    if (!selectedExam) return;
    const currentKeys = selectedExam.examKeys[activeCode] || {};
    const updatedCodeKeys = { ...currentKeys, [questionNum]: choice };

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [activeCode]: updatedCodeKeys,
      },
    };

    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
  };

  const handleAddNewCode = () => {
    if (!selectedExam) return;
    const existingCodes = Object.keys(selectedExam.examKeys);
    const newCodeNumber = 101 + existingCodes.length;
    const newCode = newCodeNumber.toString();

    // Generate rotated keys
    const options: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    const newKeys: Record<number, "A" | "B" | "C" | "D"> = {};
    for (let i = 1; i <= selectedExam.questionCount; i++) {
      newKeys[i] = options[(i + existingCodes.length) % 4];
    }

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [newCode]: newKeys,
      },
    };

    setSelectedExam(updatedExam);
    setActiveCode(newCode);
    onSaveExam(updatedExam);
  };

  const handleDeleteCode = (codeToDelete: string) => {
    if (!selectedExam) return;
    const codes = Object.keys(selectedExam.examKeys);
    if (codes.length <= 1) {
      alert("Bài thi phải có ít nhất 1 mã đề!");
      return;
    }

    const newExamKeys = { ...selectedExam.examKeys };
    delete newExamKeys[codeToDelete];

    const nextActive = Object.keys(newExamKeys)[0] || "101";

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: newExamKeys,
    };

    setSelectedExam(updatedExam);
    setActiveCode(nextActive);
    onSaveExam(updatedExam);
    triggerSaveToast(`Đã xóa mã đề ${codeToDelete}`);
  };

  const handleDuplicateCode = (codeToDup: string) => {
    if (!selectedExam) return;
    const existingCodes = Object.keys(selectedExam.examKeys);
    const nextCodeNum = 101 + existingCodes.length;
    const newCode = nextCodeNum.toString();

    const clonedKeys = { ...(selectedExam.examKeys[codeToDup] || {}) };

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [newCode]: clonedKeys,
      },
    };

    setSelectedExam(updatedExam);
    setActiveCode(newCode);
    onSaveExam(updatedExam);
    triggerSaveToast(`Đã nhân bản mã đề ${codeToDup} thành mã đề ${newCode}`);
  };

  const handleSetAllAnswers = (choice: string) => {
    if (!selectedExam) return;
    const updatedCodeKeys: Record<number, string> = {};
    for (let i = 1; i <= selectedExam.questionCount; i++) {
      updatedCodeKeys[i] = choice;
    }
    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [activeCode]: updatedCodeKeys,
      },
    };
    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    triggerSaveToast(`Đã đặt tất cả đáp án mã đề ${activeCode} thành ${choice}`);
  };

  const handleRandomizeAnswers = () => {
    if (!selectedExam) return;
    const options = ["A", "B", "C", "D"];
    const updatedCodeKeys: Record<number, string> = {};
    for (let i = 1; i <= selectedExam.questionCount; i++) {
      updatedCodeKeys[i] = options[Math.floor(Math.random() * options.length)];
    }
    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [activeCode]: updatedCodeKeys,
      },
    };
    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    triggerSaveToast(`Đã tạo ngẫu nhiên đáp án cho mã đề ${activeCode}`);
  };

  const handlePasteKeyImport = () => {
    if (!selectedExam || !pasteKeyText.trim()) return;

    // Parse strings like "1A 2B 3C" or "A B C D A B C D" or "ABCDABCD"
    const cleaned = pasteKeyText.replace(/[\n\r,;]/g, " ").trim();
    const parts = cleaned.split(/\s+/);
    const newKeys: Record<number, "A" | "B" | "C" | "D"> = {};

    let qCount = 0;
    parts.forEach((p) => {
      const matchWithNum = p.match(/^(\d+)\s*([ABCDabcd])$/);
      if (matchWithNum) {
        const qNum = parseInt(matchWithNum[1], 10);
        const ans = matchWithNum[2].toUpperCase() as "A" | "B" | "C" | "D";
        if (qNum <= selectedExam.questionCount) {
          newKeys[qNum] = ans;
        }
      } else {
        const letters = p.replace(/[^ABCDabcd]/g, "").toUpperCase();
        for (let i = 0; i < letters.length; i++) {
          qCount++;
          if (qCount <= selectedExam.questionCount) {
            newKeys[qCount] = letters[i] as "A" | "B" | "C" | "D";
          }
        }
      }
    });

    if (Object.keys(newKeys).length > 0) {
      const updatedExam: Exam = {
        ...selectedExam,
        examKeys: {
          ...selectedExam.examKeys,
          [activeCode]: { ...selectedExam.examKeys[activeCode], ...newKeys },
        },
      };
      setSelectedExam(updatedExam);
      onSaveExam(updatedExam);
      setShowPasteModal(false);
      setPasteKeyText("");
      triggerSaveToast(`Đã cập nhật đáp án dán cho mã đề ${activeCode}!`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-600" />
            <span>Quản Lý Bài Kiểm Tra & Bảng Đáp Án</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập ma trận đáp án cho các mã đề (101, 102...), sẵn sàng cho AI OMR quét chấm.
          </p>
        </div>

        <button
          onClick={() => setShowNewExamModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bài Thi Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exam List */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Danh Sách Bài Thi ({exams.length})
          </h3>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExam(exam);
                    setActiveCode(Object.keys(exam.examKeys)[0] || "101");
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-500 shadow-sm"
                      : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {exam.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{exam.gradeClass}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-2">{exam.title}</h4>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/50">
                    <span>{exam.questionCount} câu hỏi</span>
                    <span>{Object.keys(exam.examKeys).length} mã đề</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Answer Key Editor */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {selectedExam ? (
            <>
              {/* Header Details of selected exam */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {selectedExam.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedExam.gradeClass}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">{selectedExam.title}</h2>
                  <p className="text-xs text-slate-500">
                    Thời gian: {selectedExam.durationMinutes} phút | Số câu hỏi: {selectedExam.questionCount} câu
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEditModal}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-all border border-indigo-200 flex items-center gap-1.5"
                    title="Chỉnh sửa tên, môn, khối, số câu hỏi và thời gian thi"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>Sửa Thông Tin Đề</span>
                  </button>
                  <button
                    onClick={() => onOpenPrintSheet(selectedExam)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In Phiếu Thi OMR</span>
                  </button>
                  <button
                    onClick={() => onDeleteExam(selectedExam.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Xóa bài thi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exam Codes Selector & Code Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Mã Đề:</span>
                  {Object.keys(selectedExam.examKeys).map((code) => {
                    const isActive = activeCode === code;
                    return (
                      <div key={code} className="inline-flex items-center group">
                        <button
                          onClick={() => setActiveCode(code)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-xs rounded-lg"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg"
                          }`}
                        >
                          Đề {code}
                        </button>
                        {Object.keys(selectedExam.examKeys).length > 1 && (
                          <button
                            onClick={() => handleDeleteCode(code)}
                            className="ml-1 p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title={`Xóa mã đề ${code}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddNewCode}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    title="Tạo mã đề mới"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Mã Đề</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateCode(activeCode)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 transition-colors flex items-center gap-1"
                    title={`Nhân bản đáp án từ mã đề ${activeCode}`}
                  >
                    <Copy className="w-3 h-3" />
                    <span>Nhân Bản ({activeCode})</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPasteModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Dán Chuỗi Đáp Án</span>
                </button>
              </div>

              {/* Batch Answer Controls Bar */}
              <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Gán nhanh đáp án mã đề {activeCode}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["A", "B", "C", "D"] as const).map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleSetAllAnswers(choice)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-colors"
                    >
                      Tất cả {choice}
                    </button>
                  ))}
                  <button
                    onClick={handleRandomizeAnswers}
                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                  >
                    Tạo Ngẫu Nhiên
                  </button>
                </div>
              </div>

              {/* Answer Key Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Bảng Đáp Án Chi Tiết Mã Đề {activeCode} ({selectedExam.questionCount} Câu)
                  </h3>
                  <span className="text-[11px] text-slate-500">Bấm chọn đáp án đúng cho từng câu hỏi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[440px] overflow-y-auto pr-1">
                  {Array.from({ length: selectedExam.questionCount }).map((_, index) => {
                    const qNum = index + 1;
                    const currentAns = selectedExam.examKeys[activeCode]?.[qNum] || "A";

                    return (
                      <div
                        key={qNum}
                        className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-800 font-mono w-14">Câu {qNum}:</span>

                        <div className="flex items-center gap-1">
                          {(["A", "B", "C", "D"] as const).map((choice) => {
                            const isSelected = currentAns === choice;
                            return (
                              <button
                                key={choice}
                                onClick={() => handleUpdateAnswerKey(qNum, choice)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-xs scale-105"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-200/60"
                                }`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Key className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Chưa chọn bài thi nào. Vui lòng chọn bài thi từ danh sách bên trái.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Exam */}
      {showNewExamModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tạo Bài Kiểm Tra Mới</h3>

            <form onSubmit={handleCreateNewExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài kiểm tra</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm Tra Khảo Sát Toán 8 - Giữa Kỳ 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                  >
                    <option>Khoa học Tự nhiên</option>
                    <option>Toán Học</option>
                    <option>Tiếng Anh</option>
                    <option>Lịch Sử & Địa Lý</option>
                    <option>Ngữ Văn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                  >
                    <option>Khối 6</option>
                    <option>Khối 7</option>
                    <option>Khối 8</option>
                    <option>Khối 9</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số câu hỏi</label>
                  <select
                    value={newQuestionCount}
                    onChange={(e) => setNewQuestionCount(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600 font-bold text-indigo-900"
                  >
                    <option value={5}>5 Câu</option>
                    <option value={7}>7 Câu</option>
                    <option value={8}>8 Câu</option>
                    <option value={9}>9 Câu</option>
                    <option value={10}>10 Câu</option>
                    <option value={11}>11 Câu</option>
                    <option value={12}>12 Câu</option>
                    <option value={15}>15 Câu</option>
                    <option value={20}>20 Câu</option>
                    <option value={25}>25 Câu</option>
                    <option value={30}>30 Câu</option>
                    <option value={40}>40 Câu (Tiêu chuẩn)</option>
                    <option value={50}>50 Câu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (Phút)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Tạo Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Exam */}
      {showEditExamModal && selectedExam && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              <span>Chỉnh Sửa Thông Tin Bài Thi & Số Câu</span>
            </h3>

            <form onSubmit={handleSaveEditExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài kiểm tra</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Bài kiểm tra thường xuyên ngữ văn 8"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-indigo-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                  >
                    <option>Khoa học Tự nhiên</option>
                    <option>Toán Học</option>
                    <option>Tiếng Anh</option>
                    <option>Lịch Sử & Địa Lý</option>
                    <option>Ngữ Văn</option>
                    <option>Vật Lý</option>
                    <option>Hóa Học</option>
                    <option>Sinh Học</option>
                    <option>Tin Học</option>
                    <option>GDCD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600"
                  >
                    <option>Khối 6</option>
                    <option>Khối 7</option>
                    <option>Khối 8</option>
                    <option>Khối 9</option>
                    <option>Khối 10</option>
                    <option>Khối 11</option>
                    <option>Khối 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số câu hỏi <span className="text-indigo-600 font-normal">(Thay đổi tự động chỉnh đáp án)</span>
                  </label>
                  <select
                    value={editQuestionCount}
                    onChange={(e) => setEditQuestionCount(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600 font-bold text-indigo-900"
                  >
                    <option value={5}>5 Câu</option>
                    <option value={7}>7 Câu</option>
                    <option value={8}>8 Câu</option>
                    <option value={9}>9 Câu</option>
                    <option value={10}>10 Câu</option>
                    <option value={11}>11 Câu</option>
                    <option value={12}>12 Câu</option>
                    <option value={15}>15 Câu</option>
                    <option value={20}>20 Câu</option>
                    <option value={25}>25 Câu</option>
                    <option value={30}>30 Câu</option>
                    <option value={40}>40 Câu (Tiêu chuẩn)</option>
                    <option value={50}>50 Câu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (Phút)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-indigo-600 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditExamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Paste Key Text */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dán Nhanh Chuỗi Đáp Án Mã Đề {activeCode}</h3>
            <p className="text-xs text-slate-500 mb-3">
              Nhập dạng: <code className="bg-slate-100 px-1 rounded text-indigo-600">ABCDABCD...</code> hoặc <code className="bg-slate-100 px-1 rounded text-indigo-600">1A 2B 3C 4D...</code>
            </p>

            <textarea
              rows={5}
              value={pasteKeyText}
              onChange={(e) => setPasteKeyText(e.target.value)}
              placeholder="Ví dụ: ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-mono focus:outline-indigo-600"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handlePasteKeyImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Cập Nhật Đáp Án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
