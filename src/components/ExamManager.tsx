import React, { useState } from "react";
import { Exam, QuestionType } from "../types";
import { Plus, Edit3, Trash2, Key, Printer, CheckCircle, FileSpreadsheet, Copy, Sparkles, Save, HelpCircle, ArrowLeft, Check, ListChecks, Link, Type } from "lucide-react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [pasteKeyText, setPasteKeyText] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // New Exam Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Khoa học Tự nhiên");
  const [newGrade, setNewGrade] = useState("Khối 8");
  const [newQuestionCount, setNewQuestionCount] = useState<number>(40);
  const [newDuration, setNewDuration] = useState<number>(45);

  // Integrated Question Types Checklist
  const [enabledFormats, setEnabledFormats] = useState<{
    multiple_choice: boolean;
    true_false: boolean;
    matching: boolean;
    fill_blank: boolean;
  }>({
    multiple_choice: true,
    true_false: true,
    matching: false,
    fill_blank: false,
  });

  const handleCreateNewExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Get active question types from checklist
    const activeTypes = (Object.keys(enabledFormats) as QuestionType[]).filter(
      (k) => enabledFormats[k]
    );
    const finalActiveTypes = activeTypes.length > 0 ? activeTypes : (["multiple_choice"] as QuestionType[]);

    // Generate answer keys and question type assignment per question
    const defaultKeys101: Record<number, string> = {};
    const qTypesMap: Record<number, QuestionType> = {};

    // Calculate smart distribution of questions if multiple types checked
    // E.g., for MoET style (40 questions): 18 Multiple Choice, 12 True/False, 10 Short answer/Matching
    let mcCount = 0;
    let tfCount = 0;
    let matchCount = 0;
    let fillCount = 0;

    if (finalActiveTypes.length === 1) {
      const soleType = finalActiveTypes[0];
      if (soleType === "multiple_choice") mcCount = newQuestionCount;
      else if (soleType === "true_false") tfCount = newQuestionCount;
      else if (soleType === "matching") matchCount = newQuestionCount;
      else fillCount = newQuestionCount;
    } else {
      // Multi-type integration
      if (enabledFormats.multiple_choice) {
        mcCount = Math.ceil(newQuestionCount * 0.5);
      }
      const remaining = newQuestionCount - mcCount;
      const otherActive = finalActiveTypes.filter((t) => t !== "multiple_choice");
      const perOther = Math.floor(remaining / (otherActive.length || 1));

      otherActive.forEach((t, idx) => {
        const isLast = idx === otherActive.length - 1;
        const count = isLast ? remaining - perOther * idx : perOther;
        if (t === "true_false") tfCount = count;
        if (t === "matching") matchCount = count;
        if (t === "fill_blank") fillCount = count;
      });
    }

    let currentQ = 1;

    // Fill Multiple Choice
    for (let i = 0; i < mcCount && currentQ <= newQuestionCount; i++) {
      qTypesMap[currentQ] = "multiple_choice";
      const options = ["A", "B", "C", "D"];
      defaultKeys101[currentQ] = options[i % 4];
      currentQ++;
    }

    // Fill True/False
    for (let i = 0; i < tfCount && currentQ <= newQuestionCount; i++) {
      qTypesMap[currentQ] = "true_false";
      defaultKeys101[currentQ] = i % 2 === 0 ? "Đ" : "S";
      currentQ++;
    }

    // Fill Matching
    for (let i = 0; i < matchCount && currentQ <= newQuestionCount; i++) {
      qTypesMap[currentQ] = "matching";
      const pairs = ["1-A", "1-B", "1-C", "1-D"];
      defaultKeys101[currentQ] = pairs[i % 4];
      currentQ++;
    }

    // Fill Fill-in-the-blank
    for (let i = 0; i < fillCount && currentQ <= newQuestionCount; i++) {
      qTypesMap[currentQ] = "fill_blank";
      defaultKeys101[currentQ] = "Đáp án " + currentQ;
      currentQ++;
    }

    const created: Exam = {
      id: "EX-" + Date.now().toString(36).toUpperCase(),
      title: newTitle.trim(),
      subject: newSubject,
      gradeClass: newGrade,
      questionCount: newQuestionCount,
      durationMinutes: newDuration,
      createdAt: new Date().toISOString().split("T")[0],
      defaultQuestionType: finalActiveTypes[0] || "multiple_choice",
      enabledFormats: enabledFormats,
      questionTypes: qTypesMap,
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

  const handleUpdateQuestionType = (questionNum: number, type: QuestionType) => {
    if (!selectedExam) return;
    const updatedTypes = { ...(selectedExam.questionTypes || {}), [questionNum]: type };
    const updatedExam: Exam = {
      ...selectedExam,
      questionTypes: updatedTypes,
    };
    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
  };

  const handleApplyAllQuestionType = (type: QuestionType) => {
    if (!selectedExam) return;
    const updatedTypes: Record<number, QuestionType> = {};
    for (let i = 1; i <= selectedExam.questionCount; i++) {
      updatedTypes[i] = type;
    }
    const updatedExam: Exam = {
      ...selectedExam,
      defaultQuestionType: type,
      questionTypes: updatedTypes,
    };
    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    triggerSaveToast();
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
      triggerSaveToast();
    }
  };

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Đã lưu đáp án thành công!</span>
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

              {/* Exam Codes Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Mã Đề:</span>
                  {Object.keys(selectedExam.examKeys).map((code) => (
                    <button
                      key={code}
                      onClick={() => setActiveCode(code)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        activeCode === code
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Đề {code}
                    </button>
                  ))}
                  <button
                    onClick={handleAddNewCode}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Mã Đề</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPasteModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Dán Chuỗi Đáp Án</span>
                </button>
              </div>

              {/* Quick Batch Question Type Switcher */}
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  <span>Áp dụng dạng câu hỏi cho toàn bộ bài thi:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleApplyAllQuestionType("multiple_choice")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    Trắc nghiệm (A,B,C,D)
                  </button>
                  <button
                    onClick={() => handleApplyAllQuestionType("true_false")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    Đúng / Sai (Đ,S)
                  </button>
                  <button
                    onClick={() => handleApplyAllQuestionType("matching")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    Câu hỏi Nối
                  </button>
                  <button
                    onClick={() => handleApplyAllQuestionType("fill_blank")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                  >
                    Điền khuyết
                  </button>
                </div>
              </div>

              {/* Answer Key Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Bảng Đáp Án Chi Tiết Mã Đề {activeCode} ({selectedExam.questionCount} Câu)
                  </h3>
                  <span className="text-[11px] text-slate-500">Bấm chọn hoặc nhập đáp án theo dạng câu hỏi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[440px] overflow-y-auto pr-1">
                  {Array.from({ length: selectedExam.questionCount }).map((_, index) => {
                    const qNum = index + 1;
                    const currentAns = selectedExam.examKeys[activeCode]?.[qNum] || "A";
                    const qType: QuestionType = selectedExam.questionTypes?.[qNum] || selectedExam.defaultQuestionType || "multiple_choice";

                    return (
                      <div
                        key={qNum}
                        className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-xs font-bold text-slate-800">Câu {qNum}</span>
                          <select
                            value={qType}
                            onChange={(e) => handleUpdateQuestionType(qNum, e.target.value as QuestionType)}
                            className="text-[10px] font-extrabold rounded-md px-1.5 py-0.5 border border-slate-200 bg-white cursor-pointer"
                          >
                            <option value="multiple_choice">Trắc nghiệm</option>
                            <option value="true_false">Đúng / Sai</option>
                            <option value="matching">Dạng Nối</option>
                            <option value="fill_blank">Điền khuyết</option>
                          </select>
                        </div>

                        {/* RENDER ANSWER INPUT BASED ON QUESTION TYPE */}
                        {qType === "multiple_choice" && (
                          <div className="flex items-center justify-center gap-1">
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
                        )}

                        {qType === "true_false" && (
                          <div className="flex items-center justify-center gap-2">
                            {[
                              { label: "Đúng", val: "Đ" },
                              { label: "Sai", val: "S" },
                            ].map((tf) => {
                              const isSelected = currentAns === tf.val;
                              return (
                                <button
                                  key={tf.val}
                                  onClick={() => handleUpdateAnswerKey(qNum, tf.val)}
                                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? tf.val === "Đ"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-red-600 text-white shadow-xs"
                                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {tf.label} ({tf.val})
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {qType === "matching" && (
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              {["1-A", "1-B", "1-C", "1-D"].map((pair) => (
                                <button
                                  key={pair}
                                  onClick={() => handleUpdateAnswerKey(qNum, pair)}
                                  className={`py-0.5 rounded text-[10px] font-bold border ${
                                    currentAns === pair
                                      ? "bg-amber-500 text-white border-amber-600"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                                  }`}
                                >
                                  {pair}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={currentAns}
                              onChange={(e) => handleUpdateAnswerKey(qNum, e.target.value)}
                              placeholder="Tùy chỉnh ghép (vd: 1-A, 2-C)"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-800 font-mono focus:outline-indigo-600"
                            />
                          </div>
                        )}

                        {qType === "fill_blank" && (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={currentAns}
                              onChange={(e) => handleUpdateAnswerKey(qNum, e.target.value)}
                              placeholder="Nhập từ / con số..."
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:outline-indigo-600"
                            />
                          </div>
                        )}
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

              {/* TÍCH HỢP CẤU TRÚC DẠNG CÂU HỎI (TÙY CHỌN THEO BỘ MÔN / DẠNG BÀI KIỂM TRA) */}
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    Tích Hợp Dạng Câu Hỏi (Tùy Chọn Theo Bộ Môn)
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Cấu trúc linh hoạt
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-slate-500">Mẫu nhanh:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledFormats({
                        multiple_choice: true,
                        true_false: false,
                        matching: false,
                        fill_blank: false,
                      })
                    }
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  >
                    100% Trắc nghiệm (A,B,C,D)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledFormats({
                        multiple_choice: true,
                        true_false: true,
                        matching: false,
                        fill_blank: true,
                      })
                    }
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  >
                    Chuẩn Bộ GD&ĐT (TN + Đúng/Sai + Điền)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledFormats({
                        multiple_choice: true,
                        true_false: true,
                        matching: true,
                        fill_blank: true,
                      })
                    }
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-amber-700 border border-amber-200 hover:bg-amber-100"
                  >
                    Tích hợp tất cả các dạng
                  </button>
                </div>

                {/* Checkbox Options */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-200/60">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enabledFormats.multiple_choice}
                      onChange={(e) =>
                        setEnabledFormats((prev) => ({ ...prev, multiple_choice: e.target.checked }))
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>1. Trắc nghiệm (A, B, C, D)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enabledFormats.true_false}
                      onChange={(e) =>
                        setEnabledFormats((prev) => ({ ...prev, true_false: e.target.checked }))
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>2. Đúng / Sai (Mỗi câu Đ/S)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enabledFormats.matching}
                      onChange={(e) =>
                        setEnabledFormats((prev) => ({ ...prev, matching: e.target.checked }))
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>3. Câu hỏi Ghép nối</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enabledFormats.fill_blank}
                      onChange={(e) =>
                        setEnabledFormats((prev) => ({ ...prev, fill_blank: e.target.checked }))
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>4. Trả lời ngắn / Điền khuyết</span>
                  </label>
                </div>

                <p className="text-[10.5px] text-indigo-900 font-medium italic">
                  *Được tự động tích hợp trực tiếp vào Phiếu trả lời trắc nghiệm OMR và Bảng đáp án khảo thí.
                </p>
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
