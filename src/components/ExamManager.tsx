import React, { useState, useEffect } from "react";
import { Exam } from "../types";
import { Plus, Edit3, Trash2, Key, Printer, CheckCircle, FileSpreadsheet, Copy, Sparkles, Save, HelpCircle, ArrowLeft, Check, Link, Type, Eye, Download, RotateCcw, Undo2, Redo2, FileText, RefreshCw, X, FolderCheck } from "lucide-react";

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

  // Undo / Redo History Stack per Exam
  const [historyStack, setHistoryStack] = useState<Record<string, Record<number, string>>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, Record<number, string>>[]>([]);
  const [deletedCodesBuffer, setDeletedCodesBuffer] = useState<{ code: string; keys: Record<number, string>; timestamp: string }[]>([]);

  // Modals for Saved Codes List & View Details
  const [showSavedCodesModal, setShowSavedCodesModal] = useState(false);
  const [showViewCodeModal, setShowViewCodeModal] = useState(false);
  const [viewingCode, setViewingCode] = useState<string>("101");

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
    setHistoryStack([]);
    setRedoStack([]);
  };

  const pushHistoryState = () => {
    if (!selectedExam) return;
    setHistoryStack((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(selectedExam.examKeys))]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!selectedExam) return;
    if (historyStack.length > 0) {
      const prevKeys = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, prev.length - 1));
      setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(selectedExam.examKeys))]);

      const updatedExam: Exam = {
        ...selectedExam,
        examKeys: prevKeys,
      };

      if (!prevKeys[activeCode]) {
        setActiveCode(Object.keys(prevKeys)[0] || "101");
      }

      setSelectedExam(updatedExam);
      onSaveExam(updatedExam);
      triggerSaveToast("Đã hoàn tác (Undo) thao tác vừa rồi!");
    } else if (deletedCodesBuffer.length > 0) {
      const lastDeleted = deletedCodesBuffer[deletedCodesBuffer.length - 1];
      setDeletedCodesBuffer((prev) => prev.slice(0, prev.length - 1));

      const updatedExam: Exam = {
        ...selectedExam,
        examKeys: {
          ...selectedExam.examKeys,
          [lastDeleted.code]: lastDeleted.keys,
        },
      };

      setSelectedExam(updatedExam);
      setActiveCode(lastDeleted.code);
      onSaveExam(updatedExam);
      triggerSaveToast(`Đã hoàn tác & khôi phục mã đề ${lastDeleted.code}!`);
    }
  };

  const handleRedo = () => {
    if (!selectedExam || redoStack.length === 0) return;
    const nextKeys = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(selectedExam.examKeys))]);

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: nextKeys,
    };

    if (!nextKeys[activeCode]) {
      setActiveCode(Object.keys(nextKeys)[0] || "101");
    }

    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    triggerSaveToast("Đã làm lại (Redo) thao tác!");
  };

  const handleSaveActiveCode = () => {
    if (!selectedExam) return;
    onSaveExam(selectedExam);
    triggerSaveToast(`Đã lưu cấu hình mã đề ${activeCode} thành công!`);
  };

  const handleDownloadCodeKeys = (code: string, format: "txt" | "csv" | "json") => {
    if (!selectedExam) return;
    const keys = selectedExam.examKeys[code] || {};
    const totalQ = selectedExam.questionCount;

    let content = "";
    let fileName = `${selectedExam.title.replace(/[^a-zA-Z0-9_À-ỹ]/g, "_")}_MaDe_${code}`;
    let mimeType = "text/plain";

    if (format === "txt") {
      fileName += "_DapAn.txt";
      content = `=== BẢNG ĐÁP ÁN MÃ ĐỀ ${code} ===\n`;
      content += `Bài thi: ${selectedExam.title}\n`;
      content += `Môn: ${selectedExam.subject} | Khối: ${selectedExam.gradeClass}\n`;
      content += `Số câu: ${totalQ} câu | Thời gian: ${selectedExam.durationMinutes} phút\n`;
      content += `Ngày xuất: ${new Date().toLocaleString("vi-VN")}\n\n`;
      content += `--- CHUỖI ĐÁP ÁN ---\n`;

      let lineStr = "";
      for (let i = 1; i <= totalQ; i++) {
        lineStr += `${i}${keys[i] || "A"} `;
        if (i % 10 === 0) {
          content += lineStr.trim() + "\n";
          lineStr = "";
        }
      }
      if (lineStr.trim()) content += lineStr.trim() + "\n";

      content += `\n--- CHI TIẾT TỪNG CÂU ---\n`;
      for (let i = 1; i <= totalQ; i++) {
        content += `Câu ${i.toString().padStart(2, "0")}: ${keys[i] || "A"}\n`;
      }
    } else if (format === "csv") {
      fileName += "_DapAn.csv";
      mimeType = "text/csv;charset=utf-8;";
      content = "\uFEFF"; // UTF-8 BOM
      content += "STT,Cau,Dap_An\n";
      for (let i = 1; i <= totalQ; i++) {
        content += `${i},Câu ${i},${keys[i] || "A"}\n`;
      }
    } else if (format === "json") {
      fileName += "_DapAn.json";
      mimeType = "application/json";
      const jsonObj = {
        examTitle: selectedExam.title,
        subject: selectedExam.subject,
        gradeClass: selectedExam.gradeClass,
        questionCount: totalQ,
        examCode: code,
        savedAt: new Date().toISOString(),
        answers: keys,
      };
      content = JSON.stringify(jsonObj, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerSaveToast(`Đã tải xuống tệp đáp án Mã đề ${code} (${format.toUpperCase()})`);
  };

  const handleUpdateAnswerKey = (questionNum: number, choice: string) => {
    if (!selectedExam) return;
    pushHistoryState();
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

  useEffect(() => {
    if (selectedExam) {
      const match = exams.find((e) => e.id === selectedExam.id);
      if (match) {
        setSelectedExam(match);
        // Ensure activeCode exists in matched exam keys
        if (!match.examKeys[activeCode]) {
          setActiveCode(Object.keys(match.examKeys)[0] || "101");
        }
      } else if (exams.length > 0) {
        setSelectedExam(exams[0]);
        setActiveCode(Object.keys(exams[0].examKeys)[0] || "101");
      } else {
        setSelectedExam(null);
      }
    } else if (exams.length > 0) {
      setSelectedExam(exams[0]);
      setActiveCode(Object.keys(exams[0].examKeys)[0] || "101");
    }
  }, [exams]);

  const getNextAvailableCode = (existingCodes: string[]): string => {
    const nums = existingCodes
      .map((c) => parseInt(c, 10))
      .filter((n) => !isNaN(n));
    let nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 101;
    if (nextNum < 101) nextNum = 101;

    while (existingCodes.includes(nextNum.toString())) {
      nextNum++;
    }
    return nextNum.toString();
  };

  const handleAddNewCode = () => {
    if (!selectedExam) return;
    pushHistoryState();
    const existingCodes = Object.keys(selectedExam.examKeys);
    const newCode = getNextAvailableCode(existingCodes);

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
    triggerSaveToast(`Đã tạo thành công mã đề mới ${newCode}!`);
  };

  const handleDeleteCode = (codeToDelete: string) => {
    if (!selectedExam) return;
    const codes = Object.keys(selectedExam.examKeys);
    if (codes.length <= 1) {
      alert("Bài thi phải có ít nhất 1 mã đề!");
      return;
    }

    pushHistoryState();

    const keysToDelete = selectedExam.examKeys[codeToDelete] || {};
    setDeletedCodesBuffer((prev) => [
      ...prev,
      {
        code: codeToDelete,
        keys: keysToDelete,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      },
    ]);

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
    triggerSaveToast(`Đã xóa mã đề ${codeToDelete}. Nhấn "Hoàn tác" để khôi phục!`);
  };

  const handleDuplicateCode = (codeToDup: string) => {
    if (!selectedExam) return;
    pushHistoryState();
    const existingCodes = Object.keys(selectedExam.examKeys);
    const newCode = getNextAvailableCode(existingCodes);

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
    pushHistoryState();
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
    pushHistoryState();
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

  const parseAnswerString = (text: string, totalQuestions: number): Record<number, "A" | "B" | "C" | "D"> => {
    const result: Record<number, "A" | "B" | "C" | "D"> = {};
    if (!text || !text.trim()) return result;

    // Clean decorative headers, Vietnamese prefixes and normalize explicit question pairs
    // e.g., "1: A", "1.A", "1-A", "1)A", "1 = A", "Câu 1: A" -> " 1A "
    const cleaned = text
      .replace(/(bảng|đáp|án|mã|đề|câu|bài)\b/gi, " ")
      .replace(/(\d{1,3})\s*[:=.\-\)]*\s*([ABCDabcd])\b/gi, " $1$2 ")
      .replace(/[,;:=]+/g, " ")
      .trim();

    // Tokenize by whitespace, newlines, tabs
    const tokens = cleaned.split(/\s+/);
    let currentQ = 1;

    for (const token of tokens) {
      if (!token) continue;

      // Pattern A: Single token explicit pair (e.g., "1A")
      const pairMatch = token.match(/^(\d{1,3})([ABCDabcd])$/i);
      if (pairMatch) {
        const qNum = parseInt(pairMatch[1], 10);
        const ans = pairMatch[2].toUpperCase() as "A" | "B" | "C" | "D";
        if (qNum >= 1 && qNum <= totalQuestions) {
          result[qNum] = ans;
          currentQ = qNum + 1;
        }
        continue;
      }

      // Pattern B: Standalone question number (e.g., "1", "1.", "1)")
      const numMatch = token.match(/^(\d{1,3})[.\-\)]*$/);
      if (numMatch) {
        const qNum = parseInt(numMatch[1], 10);
        if (qNum >= 1 && qNum <= totalQuestions) {
          currentQ = qNum;
        }
        continue;
      }

      // Pattern C: Multiple continuous explicit pairs in a single token (e.g., "1A2B3C4D")
      const multiPairMatches = Array.from(token.matchAll(/(\d{1,3})([ABCDabcd])/gi));
      if (multiPairMatches.length > 0) {
        for (const m of multiPairMatches) {
          const qNum = parseInt(m[1], 10);
          const ans = m[2].toUpperCase() as "A" | "B" | "C" | "D";
          if (qNum >= 1 && qNum <= totalQuestions) {
            result[qNum] = ans;
            currentQ = qNum + 1;
          }
        }
        continue;
      }

      // Pattern D: Raw answer letters (e.g., "A", "B", "ABCD", "ADCBBC...")
      const lettersOnly = token.replace(/[^ABCDabcd]/g, "").toUpperCase();
      for (let i = 0; i < lettersOnly.length; i++) {
        while (currentQ <= totalQuestions && result[currentQ]) {
          currentQ++;
        }
        if (currentQ <= totalQuestions) {
          result[currentQ] = lettersOnly[i] as "A" | "B" | "C" | "D";
          currentQ++;
        }
      }
    }

    return result;
  };

  const handleOpenPasteModal = () => {
    if (!selectedExam) return;
    const currentKeys = selectedExam.examKeys[activeCode] || {};
    let defaultStr = "";
    for (let i = 1; i <= selectedExam.questionCount; i++) {
      const ans = currentKeys[i] || "A";
      defaultStr += `${i}${ans} `;
    }
    setPasteKeyText(defaultStr.trim());
    setShowPasteModal(true);
  };

  const convertTextToFormat = (formatType: "numbered" | "dotted" | "continuous") => {
    if (!selectedExam) return;
    const parsed = parseAnswerString(pasteKeyText, selectedExam.questionCount);
    const parsedKeys = Object.keys(parsed)
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b);

    if (parsedKeys.length === 0) return;

    const limit = Math.max(...parsedKeys);
    let formatted = "";

    if (formatType === "numbered") {
      for (let i = 1; i <= limit; i++) {
        if (parsed[i]) {
          formatted += `${i}${parsed[i]} `;
        }
      }
    } else if (formatType === "dotted") {
      for (let i = 1; i <= limit; i++) {
        if (parsed[i]) {
          formatted += `${i}.${parsed[i]} `;
        }
      }
    } else if (formatType === "continuous") {
      for (let i = 1; i <= limit; i++) {
        if (parsed[i]) {
          formatted += parsed[i];
        }
      }
    }

    setPasteKeyText(formatted.trim());
  };

  const handlePasteKeyImport = () => {
    if (!selectedExam) return;
    const parsed = parseAnswerString(pasteKeyText, selectedExam.questionCount);

    if (Object.keys(parsed).length === 0) {
      alert("Không tìm thấy đáp án hợp lệ (A, B, C, D) trong chuỗi nhập!");
      return;
    }

    const updatedCodeKeys = { ...(selectedExam.examKeys[activeCode] || {}) };
    Object.entries(parsed).forEach(([q, ans]) => {
      updatedCodeKeys[parseInt(q, 10)] = ans;
    });

    const updatedExam: Exam = {
      ...selectedExam,
      examKeys: {
        ...selectedExam.examKeys,
        [activeCode]: updatedCodeKeys,
      },
    };

    setSelectedExam(updatedExam);
    onSaveExam(updatedExam);
    setShowPasteModal(false);
    triggerSaveToast(`Đã cập nhật ${Object.keys(parsed).length} câu cho mã đề ${activeCode}!`);
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

              {/* Exam Code Management Toolbar: Lưu, Hoàn tác, Xem, Tải/Xóa */}
              <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderCheck className="w-4 h-4 text-emerald-400" />
                    <span>Quản Lý Mã Đề ({Object.keys(selectedExam.examKeys).length} mã)</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Lưu Mã Đề */}
                  <button
                    onClick={handleSaveActiveCode}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
                    title={`Lưu cấu hình đáp án mã đề ${activeCode}`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Mã Đề ({activeCode})</span>
                  </button>

                  {/* Hoàn Tác (Undo) */}
                  <button
                    onClick={handleUndo}
                    disabled={historyStack.length === 0 && deletedCodesBuffer.length === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5"
                    title={
                      historyStack.length > 0
                        ? `Hoàn tác thao tác vừa rồi (${historyStack.length} bước)`
                        : deletedCodesBuffer.length > 0
                        ? `Khôi phục mã đề ${deletedCodesBuffer[deletedCodesBuffer.length - 1].code}`
                        : "Không có thao tác cần hoàn tác"
                    }
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hoàn Tác</span>
                    {(historyStack.length > 0 || deletedCodesBuffer.length > 0) && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                        {historyStack.length + deletedCodesBuffer.length}
                      </span>
                    )}
                  </button>

                  {/* Làm Lại (Redo) */}
                  {redoStack.length > 0 && (
                    <button
                      onClick={handleRedo}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5"
                      title="Làm lại thao tác vừa hoàn tác"
                    >
                      <Redo2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Làm Lại ({redoStack.length})</span>
                    </button>
                  )}

                  {/* Xem Mã Đề Active */}
                  <button
                    onClick={() => {
                      setViewingCode(activeCode);
                      setShowViewCodeModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                    title={`Xem ma trận đáp án chi tiết cho mã đề ${activeCode}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Đề {activeCode}</span>
                  </button>

                  {/* Quản Lý Bản Lưu */}
                  <button
                    onClick={() => setShowSavedCodesModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5"
                    title="Danh sách bản lưu tất cả mã đề: xem, tải file, xóa hoặc khôi phục"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Xem Tất Cả Bản Lưu</span>
                  </button>

                  {/* Tải về nhanh */}
                  <div className="relative group">
                    <button
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5"
                      title="Tải tệp đáp án mã đề về máy"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tải Về Đề {activeCode}</span>
                    </button>

                    {/* Dropdown Tải Về */}
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block z-30">
                      <button
                        onClick={() => handleDownloadCodeKeys(activeCode, "txt")}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-indigo-50 font-medium flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tệp TXT Văn bản</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCodeKeys(activeCode, "csv")}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-50 font-medium flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tệp CSV / Excel</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCodeKeys(activeCode, "json")}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-amber-50 font-medium flex items-center gap-2"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tệp JSON Dữ liệu</span>
                      </button>
                    </div>
                  </div>
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
                  onClick={handleOpenPasteModal}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5 shrink-0"
                  title="Chỉnh sửa hoặc dán toàn bộ chuỗi đáp án cho mã đề"
                >
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sửa / Dán Chuỗi Đáp Án</span>
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

      {/* Modal: Edit & Paste Answer String */}
      {showPasteModal && selectedExam && (() => {
        const parsedPreview = parseAnswerString(pasteKeyText, selectedExam.questionCount);
        const parsedCount = Object.keys(parsedPreview).length;
        const totalReq = selectedExam.questionCount;
        const isComplete = parsedCount === totalReq;

        return (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Type className="w-5 h-5 text-indigo-600" />
                  <span>Sửa / Dán Chuỗi Đáp Án (Mã Đề {activeCode})</span>
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isComplete
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : parsedCount > 0
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  Đã nhận diện {parsedCount}/{totalReq} câu
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                Nhập hoặc chỉnh sửa trực tiếp chuỗi đáp án bên dưới. Hệ thống tự động nhận diện mọi định dạng:{" "}
                <code className="bg-slate-100 px-1 rounded text-indigo-700 font-bold">1A 2B 3C</code>,{" "}
                <code className="bg-slate-100 px-1 rounded text-indigo-700 font-bold">1.A, 2.B</code>,{" "}
                <code className="bg-slate-100 px-1 rounded text-indigo-700 font-bold">ABCD...</code> hoặc{" "}
                <code className="bg-slate-100 px-1 rounded text-indigo-700 font-bold">Câu 1: A</code>.
              </p>

              {/* Format Presets Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-600 mr-1">Chuyển định dạng:</span>
                <button
                  type="button"
                  onClick={() => convertTextToFormat("numbered")}
                  className="px-2 py-1 rounded bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50 text-[10.5px] font-bold transition-colors"
                >
                  1A 2B 3C...
                </button>
                <button
                  type="button"
                  onClick={() => convertTextToFormat("dotted")}
                  className="px-2 py-1 rounded bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50 text-[10.5px] font-bold transition-colors"
                >
                  1.A 2.B 3.C...
                </button>
                <button
                  type="button"
                  onClick={() => convertTextToFormat("continuous")}
                  className="px-2 py-1 rounded bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50 text-[10.5px] font-bold transition-colors"
                >
                  ABCDABCD...
                </button>
                <button
                  type="button"
                  onClick={() => setPasteKeyText("")}
                  className="px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[10.5px] font-bold transition-colors ml-auto"
                >
                  Xóa Trống
                </button>
              </div>

              {/* Textarea */}
              <textarea
                rows={5}
                value={pasteKeyText}
                onChange={(e) => setPasteKeyText(e.target.value)}
                placeholder="Dán hoặc gõ chuỗi đáp án vào đây..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-mono focus:outline-indigo-600 focus:bg-white resize-y"
              />

              {/* Real-time Parsed Answers Grid Preview */}
              <div className="mt-3 overflow-y-auto max-h-36 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-600">
                    Xem trước kết quả nhận diện ({parsedCount} câu):
                  </span>
                  {parsedCount < totalReq && (
                    <span className="text-[10.5px] text-amber-600 font-semibold italic">
                      *Còn thiếu {totalReq - parsedCount} câu
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: totalReq }, (_, idx) => idx + 1).map((qNum) => {
                    const ans = parsedPreview[qNum];
                    return (
                      <span
                        key={qNum}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ans
                            ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                            : "bg-red-50 text-red-400 border border-red-100"
                        }`}
                      >
                        {qNum}:{ans || "?"}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handlePasteKeyImport}
                  disabled={parsedCount === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cập Nhật Đáp Án ({parsedCount} câu)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 1: Quản Lý & Xem Tất Cả Mã Đề Đã Lưu */}
      {showSavedCodesModal && selectedExam && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-indigo-600" />
                  <span>Danh Sách & Bản Lưu Mã Đề ({Object.keys(selectedExam.examKeys).length} mã)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bài thi: <span className="font-bold text-slate-700">{selectedExam.title}</span> ({selectedExam.questionCount} câu)
                </p>
              </div>
              <button
                onClick={() => setShowSavedCodesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Table / Card List of Exam Codes */}
              {Object.keys(selectedExam.examKeys).map((code) => {
                const keys = selectedExam.examKeys[code] || {};
                const counts = { A: 0, B: 0, C: 0, D: 0 };
                Object.values(keys).forEach((ans) => {
                  if (ans in counts) counts[ans as keyof typeof counts]++;
                });

                return (
                  <div
                    key={code}
                    className={`p-4 rounded-xl border transition-all ${
                      activeCode === code
                        ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-600 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                            Mã Đề {code}
                          </span>
                          {activeCode === code && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              Đang chỉnh sửa
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-500">
                            {selectedExam.questionCount} câu hỏi
                          </span>
                        </div>

                        {/* Answer distribution badge */}
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-600">
                          <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">A: {counts.A}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">B: {counts.B}</span>
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">C: {counts.C}</span>
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">D: {counts.D}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Select as Active */}
                        <button
                          onClick={() => {
                            setActiveCode(code);
                            triggerSaveToast(`Đã chọn Mã đề ${code} để chỉnh sửa`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeCode === code
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {activeCode === code ? "Đang Chọn" : "Chọn Mã Này"}
                        </button>

                        {/* Xem Chi Tiết */}
                        <button
                          onClick={() => {
                            setViewingCode(code);
                            setShowViewCodeModal(true);
                          }}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          title="Xem toàn bộ ma trận đáp án"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Ma Trận</span>
                        </button>

                        {/* Tải về */}
                        <button
                          onClick={() => handleDownloadCodeKeys(code, "txt")}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          title="Tải tệp đáp án dạng TXT"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải TXT</span>
                        </button>

                        <button
                          onClick={() => handleDownloadCodeKeys(code, "csv")}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          title="Tải tệp đáp án dạng CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Tải CSV</span>
                        </button>

                        {/* Xóa */}
                        {Object.keys(selectedExam.examKeys).length > 1 && (
                          <button
                            onClick={() => handleDeleteCode(code)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 p-1.5 rounded-lg transition-colors"
                            title={`Xóa mã đề ${code}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Deleted Codes Buffer Section for Undo / Restore */}
              {deletedCodesBuffer.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Undo2 className="w-4 h-4 text-amber-500" />
                    <span>Mã Đề Đã Xóa Gần Đây (Có Thể Khôi Phục)</span>
                  </h4>
                  <div className="space-y-2">
                    {deletedCodesBuffer.map((delItem, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="text-xs">
                          <span className="font-bold text-amber-900 font-mono">Mã Đề {delItem.code}</span>
                          <span className="text-slate-500 ml-2">Đã xóa lúc {delItem.timestamp}</span>
                        </div>
                        <button
                          onClick={handleUndo}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Khôi Phục Mã Đề này</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                *Bạn có thể hoàn tác lại mọi thao tác bằng phím tắt <kbd className="bg-slate-100 border px-1 rounded text-slate-700 font-mono">Ctrl+Z</kbd>
              </span>
              <button
                onClick={() => setShowSavedCodesModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Xem Chi Tiết Đáp Án Mã Đề (Matrix Grid & Copy) */}
      {showViewCodeModal && selectedExam && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <span>Ma Trận Đáp Án Chi Tiết - Mã Đề {viewingCode}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bài thi: <span className="font-bold text-slate-700">{selectedExam.title}</span> ({selectedExam.questionCount} câu)
                </p>
              </div>
              <button
                onClick={() => setShowViewCodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answer Key Matrix Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {Array.from({ length: selectedExam.questionCount }, (_, idx) => idx + 1).map((qNum) => {
                  const ans = selectedExam.examKeys[viewingCode]?.[qNum] || "A";
                  const colorMap: Record<string, string> = {
                    A: "bg-indigo-600 text-white border-indigo-700",
                    B: "bg-emerald-600 text-white border-emerald-700",
                    C: "bg-amber-500 text-white border-amber-600",
                    D: "bg-purple-600 text-white border-purple-700",
                  };

                  return (
                    <div
                      key={qNum}
                      className="bg-white p-2 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center shadow-2xs"
                    >
                      <span className="text-[10px] font-bold text-slate-400 font-mono">Câu {qNum}</span>
                      <span
                        className={`inline-block mt-1 text-xs font-black font-mono px-2 py-0.5 rounded-lg border shadow-2xs ${
                          colorMap[ans] || "bg-indigo-600 text-white"
                        }`}
                      >
                        {ans}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Raw string preview for copying */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-300">Chuỗi đáp án nhanh:</span>
                  <button
                    onClick={() => {
                      const keys = selectedExam.examKeys[viewingCode] || {};
                      let str = "";
                      for (let i = 1; i <= selectedExam.questionCount; i++) {
                        str += `${i}${keys[i] || "A"} `;
                      }
                      navigator.clipboard.writeText(str.trim());
                      triggerSaveToast(`Đã sao chép đáp án Mã đề ${viewingCode} vào khay nhớ tạm!`);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sao Chép Chuỗi</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-300 break-all select-all">
                  {(() => {
                    const keys = selectedExam.examKeys[viewingCode] || {};
                    let str = "";
                    for (let i = 1; i <= selectedExam.questionCount; i++) {
                      str += `${i}${keys[i] || "A"} `;
                    }
                    return str.trim();
                  })()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCodeKeys(viewingCode, "txt")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải TXT</span>
                </button>
                <button
                  onClick={() => handleDownloadCodeKeys(viewingCode, "csv")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Tải CSV</span>
                </button>
              </div>

              <button
                onClick={() => setShowViewCodeModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
