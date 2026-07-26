import React, { useState, useRef, useEffect } from "react";
import { Exam, ClassRoster } from "../types";
import {
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Shuffle,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface SheetGeneratorProps {
  exams: Exam[];
  classes?: ClassRoster[];
  selectedExamId?: string;
  onBack?: () => void;
}

interface LoadedStudent {
  sbd: string;
  name: string;
  className: string;
  examCode: string;
}

export const SheetGenerator: React.FC<SheetGeneratorProps> = ({
  exams,
  classes = [],
  selectedExamId,
  onBack,
}) => {
  const [currentExam, setCurrentExam] = useState<Exam>(
    exams.find((e) => e.id === selectedExamId) || exams[0]
  );

  const [studentName, setStudentName] = useState("Nguyễn Văn An");
  const [className, setClassName] = useState("8A1");
  const [sbd, setSbd] = useState("80101");
  const [examCode, setExamCode] = useState("101");
  const [qrCanvasUrl, setQrCanvasUrl] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState<string | null>(null);

  // Student list state (from uploaded CSV or selected class)
  const [studentList, setStudentList] = useState<LoadedStudent[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  // Sync available exam codes when current exam changes
  useEffect(() => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length > 0 && !codes.includes(examCode)) {
      setExamCode(codes[0]);
    }
  }, [currentExam]);

  // Generate QR Code containing payload SBD + ExamCode
  useEffect(() => {
    const payload = JSON.stringify({
      sbd: sbd || "80101",
      code: examCode || "101",
      examId: currentExam.id,
    });

    QRCode.toDataURL(payload, { width: 120, margin: 1 }, (err, url) => {
      if (!err && url) {
        setQrCanvasUrl(url);
      }
    });
  }, [sbd, examCode, currentExam]);

  // Load students when a class is selected from existing classes
  const handleSelectClassRoster = (classId: string) => {
    const foundClass = classes.find((c) => c.id === classId);
    if (!foundClass || !foundClass.students.length) return;

    const availableCodes = Object.keys(currentExam.examKeys || {});
    const mapped: LoadedStudent[] = foundClass.students.map((st, idx) => {
      const code = availableCodes.length
        ? availableCodes[idx % availableCodes.length]
        : "101";
      return {
        sbd: st.sbd,
        name: st.name,
        className: st.gradeClass || foundClass.className,
        examCode: code,
      };
    });

    setStudentList(mapped);
    setSelectedStudentIdx(0);
    applyStudentData(mapped[0]);
    setPdfSuccessMsg(`Đã tải ${mapped.length} học sinh từ lớp ${foundClass.className}`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  const applyStudentData = (st: LoadedStudent) => {
    setStudentName(st.name);
    setClassName(st.className);
    setSbd(st.sbd);
    if (st.examCode) setExamCode(st.examCode);
  };

  const handleSelectStudentIdx = (idx: number) => {
    if (idx < 0 || idx >= studentList.length) return;
    setSelectedStudentIdx(idx);
    applyStudentData(studentList[idx]);
  };

  // Download Sample CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvHeader = "\uFEFFSTT,SBD,Họ và Tên,Lớp,Mã Đề\n";
    const sampleRows = [
      "1,80101,Nguyễn Văn An,8A1,101",
      "2,80102,Nghiêm Cao Bảo Lâm,8A1,102",
      "3,80103,Trần Thị Mai,8A1,103",
      "4,80104,Lê Hoàng Nam,8A1,104",
      "5,80105,Phạm Vũ Quốc,8A1,101",
    ].join("\n");

    const blob = new Blob([csvHeader + sampleRows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Mau_Danh_Sach_Hoc_Sinh_OMR.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload CSV Student List
  const handleFileUploadCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const availableCodes = Object.keys(currentExam.examKeys || {});
      const parsedStudents: LoadedStudent[] = [];

      lines.forEach((line, index) => {
        // Skip header line if present
        if (
          index === 0 &&
          (line.toLowerCase().includes("sbd") ||
            line.toLowerCase().includes("họ và tên") ||
            line.toLowerCase().includes("ho ten"))
        ) {
          return;
        }

        // Split by comma or semicolon
        const parts = line.split(/[,;]/).map((p) => p.trim());
        if (parts.length >= 2) {
          // Could be STT, SBD, Name, Class, Code or SBD, Name, Class
          let stSbd = "";
          let stName = "";
          let stClass = className || "8A1";
          let stCode = "";

          if (parts.length >= 4 && !isNaN(Number(parts[0]))) {
            // Format: STT, SBD, Name, Class, [Code]
            stSbd = parts[1];
            stName = parts[2];
            stClass = parts[3] || className;
            stCode = parts[4] || "";
          } else {
            // Format: SBD, Name, Class, [Code]
            stSbd = parts[0];
            stName = parts[1];
            stClass = parts[2] || className;
            stCode = parts[3] || "";
          }

          if (!stCode) {
            const fallbackCode = availableCodes.length
              ? availableCodes[parsedStudents.length % availableCodes.length]
              : "101";
            stCode = fallbackCode;
          }

          if (stName) {
            parsedStudents.push({
              sbd: stSbd || `8010${parsedStudents.length + 1}`,
              name: stName,
              className: stClass,
              examCode: stCode,
            });
          }
        }
      });

      if (parsedStudents.length > 0) {
        setStudentList(parsedStudents);
        setSelectedStudentIdx(0);
        applyStudentData(parsedStudents[0]);
        setPdfSuccessMsg(`Đã tải lên thành công danh sách ${parsedStudents.length} học sinh!`);
        setTimeout(() => setPdfSuccessMsg(null), 5000);
      } else {
        alert("Không thể đọc danh sách từ file. Vui lòng kiểm tra lại định dạng CSV.");
      }
    };

    reader.readAsText(file, "UTF-8");
    if (e.target) e.target.value = "";
  };

  // FEATURE: Shuffle / Mix Exam Code for current student
  const handleShuffleExamCode = () => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length === 0) return;
    const otherCodes = codes.filter((c) => c !== examCode);
    const chosenCode =
      otherCodes.length > 0
        ? otherCodes[Math.floor(Math.random() * otherCodes.length)]
        : codes[Math.floor(Math.random() * codes.length)];

    setExamCode(chosenCode);

    // Update loaded student's exam code if in list
    if (selectedStudentIdx >= 0 && studentList[selectedStudentIdx]) {
      const updatedList = [...studentList];
      updatedList[selectedStudentIdx].examCode = chosenCode;
      setStudentList(updatedList);
    }
  };

  // FEATURE: Distribute / Shuffle exam codes across the entire student list
  const handleDistributeExamCodesAcrossList = () => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length === 0 || studentList.length === 0) {
      handleShuffleExamCode();
      return;
    }

    const updated = studentList.map((st, idx) => {
      const nextCode = codes[idx % codes.length];
      return { ...st, examCode: nextCode };
    });

    setStudentList(updated);
    if (selectedStudentIdx >= 0 && updated[selectedStudentIdx]) {
      setExamCode(updated[selectedStudentIdx].examCode);
    }
    setPdfSuccessMsg(`Đã trộn & chia đều ${codes.length} mã đề (${codes.join(", ")}) cho ${updated.length} học sinh!`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  // FEATURE: Generate a brand new shuffled variant code with random keys
  const handleGenerateNewShuffledCode = () => {
    const existingCodes = Object.keys(currentExam.examKeys || {});
    let newCodeNum = 101;
    if (existingCodes.length > 0) {
      const maxCode = Math.max(...existingCodes.map((c) => Number(c) || 100));
      newCodeNum = maxCode + 1;
    }
    const newCode = String(newCodeNum);

    const choices: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
    const newAnswers: Record<number, "A" | "B" | "C" | "D"> = {};

    for (let q = 1; q <= currentExam.questionCount; q++) {
      newAnswers[q] = choices[Math.floor(Math.random() * choices.length)];
    }

    currentExam.examKeys[newCode] = newAnswers;
    setExamCode(newCode);

    setPdfSuccessMsg(`Đã sinh tự động Mã Đề Trộn Mới: ${newCode}!`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccessMsg(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = sheetRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const styles = Array.from(clonedDoc.querySelectorAll("style"));
          styles.forEach((style) => {
            if (style.textContent && style.textContent.includes("oklch")) {
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, "rgb(30, 41, 59)");
            }
          });

          const clonedTarget = clonedDoc.getElementById("omr-sheet-printable");
          if (clonedTarget) {
            clonedTarget.style.position = "relative";
            clonedTarget.style.width = "794px";
            clonedTarget.style.minHeight = "1123px";
            clonedTarget.style.transform = "none";
            clonedTarget.style.boxShadow = "none";
            clonedTarget.style.margin = "0 auto";
            clonedTarget.style.backgroundColor = "#ffffff";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));

      const fileName = `Phieu_OMR_${currentExam.subject || "BaiThi"}_SBD_${sbd || "80101"}_De_${examCode}.pdf`
        .replace(/\s+/g, "_");

      pdf.save(fileName);

      setPdfSuccessMsg(`Đã xuất file PDF A4 thành công: ${fileName}`);
      setTimeout(() => setPdfSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      alert("Không thể tạo file PDF tự động. Bạn có thể bấm 'In Ngay' và chọn 'Lưu dưới dạng PDF' của trình duyệt.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            <span>Tạo & In Phiếu Trả Lời Trắc Nghiệm OMR</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phiếu chuẩn 4 điểm neo góc định vị OMR & Mã QR Code định danh số báo danh tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
               Quay Lại
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isExportingPdf ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingPdf ? "Đang Xuất PDF..." : "Xuất PDF Chuẩn A4"}</span>
          </button>

          <button
            onClick={handlePrintBrowser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Ngay (Print)</span>
          </button>
        </div>
      </div>

      {pdfSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters & Controls */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Thiết Lập Thông Tin Phiếu
          </h3>

          {/* 1. Select Exam */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn Bài Thi
            </label>
            <select
              value={currentExam.id}
              onChange={(e) => {
                const found = exams.find((ex) => ex.id === e.target.value);
                if (found) setCurrentExam(found);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.questionCount} câu)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Upload / Download Student List Template section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Danh Sách Học Sinh (.CSV)
              </span>

              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer"
                title="Tải mẫu file Excel/CSV chuẩn"
              >
                <Download className="w-3 h-3" />
                Tải Mẫu
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUploadCsv}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                Up File Danh Sách Học Sinh (.CSV)
              </button>
            </div>

            {/* If class rosters exist, allow quick choice */}
            {classes.length > 0 && (
              <div>
                <label className="block text-[11px] text-slate-500 font-medium my-1">
                  Hoặc chọn từ Lớp học đã tạo:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectClassRoster(e.target.value);
                  }}
                  defaultValue=""
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="" disabled>
                    -- Chọn Lớp Học Roster --
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Lớp {cls.className} ({cls.studentCount} học sinh)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Navigator if loaded */}
            {studentList.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Đã tải: {studentList.length} HS
                  </span>
                  <span className="text-slate-500 font-mono">
                    {selectedStudentIdx + 1} / {studentList.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectStudentIdx(selectedStudentIdx - 1)}
                    disabled={selectedStudentIdx <= 0}
                    className="p-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    title="Học sinh trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={selectedStudentIdx}
                    onChange={(e) => handleSelectStudentIdx(Number(e.target.value))}
                    className="flex-1 bg-white border border-slate-300 rounded-md py-1 px-1.5 text-xs font-bold text-slate-800"
                  >
                    {studentList.map((st, i) => (
                      <option key={i} value={i}>
                        {i + 1}. {st.name} - SBD {st.sbd} (Mã đề {st.examCode})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSelectStudentIdx(selectedStudentIdx + 1)}
                    disabled={selectedStudentIdx >= studentList.length - 1}
                    className="p-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    title="Học sinh tiếp theo"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Single Student Input Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ & Tên Học Sinh
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp Học
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Báo Danh (SBD)
              </label>
              <input
                type="text"
                value={sbd}
                onChange={(e) => setSbd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Đề Thi
              </label>
              <select
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {Object.keys(currentExam.examKeys || {}).map((code) => (
                  <option key={code} value={code}>
                    Mã Đề {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. FEATURE: TRỘN MÃ ĐỀ (Exam Code Shuffling) */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-amber-600" />
                Tính Năng Trộn Mã Đề
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                {Object.keys(currentExam.examKeys || {}).length} biến thể đề
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShuffleExamCode}
                className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                title="Đổi ngẫu nhiên mã đề cho học sinh hiện tại"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Trộn Mã Đề
              </button>

              <button
                type="button"
                onClick={handleGenerateNewShuffledCode}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Tạo thêm 1 biến thể mã đề mới kèm đáp án xáo trộn"
              >
                <Plus className="w-3.5 h-3.5" />
                Sinh Mã Đề Mới
              </button>
            </div>

            {studentList.length > 0 && (
              <button
                type="button"
                onClick={handleDistributeExamCodesAcrossList}
                className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Trộn & Gán Mã Đề Tất Cả {studentList.length} Học Sinh
              </button>
            )}
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
            <p className="font-bold">Đặc Điểm Khảo Thí OMR NHQ:</p>
            <p>• 4 góc đen neo định vị chuẩn chống lệch ảnh khi camera nghiêng.</p>
            <p>• Mã QR Code chứa dữ liệu sinh tự động SBD {sbd} - Mã Đề {examCode}.</p>
          </div>
        </div>

        {/* Right Preview: Printable Sheet Canvas */}
        <div className="lg:col-span-8 flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl border border-slate-300/80 overflow-x-auto">
          <div
            id="omr-sheet-printable"
            ref={sheetRef}
            className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl relative text-black font-sans selection:bg-none print:shadow-none print:m-0 print:w-full select-none"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* 4 Corner Anchor Markers */}
            <div className="absolute top-4 left-4 w-5 h-5 bg-black"></div>
            <div className="absolute top-4 right-4 w-5 h-5 bg-black"></div>
            <div className="absolute bottom-4 left-4 w-5 h-5 bg-black"></div>
            <div className="absolute bottom-4 right-4 w-5 h-5 bg-black"></div>

            {/* Header Section */}
            <div className="border-b-2 border-black pb-3 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-extrabold text-base tracking-wide uppercase">TRƯỜNG THCS EDUMARK AI NHQ</h2>
                  <h3 className="font-bold text-sm text-indigo-900 uppercase mt-0.5">
                    PHIẾU TRẢ LỜI TRẮC NGHIỆM - {currentExam.subject.toUpperCase()}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentExam.title}</p>
                </div>

                <div className="text-right flex items-center gap-3">
                  {qrCanvasUrl && (
                    <div className="text-center">
                      <img src={qrCanvasUrl} alt="QR Code SBD" className="w-16 h-16 border border-black p-0.5 rounded" />
                      <span className="text-[9px] font-mono font-bold block mt-0.5">SBD: {sbd}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Student info lines */}
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold mt-3 pt-2 border-t border-slate-300">
                <div className="col-span-6">
                  Họ và tên học sinh: <span className="font-bold underline decoration-dotted">{studentName}</span>
                </div>
                <div className="col-span-3">
                  Lớp: <span className="font-bold underline decoration-dotted">{className}</span>
                </div>
                <div className="col-span-3 text-right">
                  Mã đề: <span className="font-bold text-sm bg-black text-white px-2 py-0.5 rounded">{examCode}</span>
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="border border-black p-2 rounded text-[10px] mb-4 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-red-600 uppercase">HƯỚNG DẪN TÔ BÀI:</span> Tô kín ô tròn bằng bút chì hoặc bút mực <span className="font-bold text-black">(●)</span>. Không gạch chéo hay đánh dấu ngắt quãng.
              </div>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span>[● Đúng]</span>
                <span className="text-slate-400">[✖ Sai]</span>
                <span className="text-slate-400">[✔ Sai]</span>
              </div>
            </div>

            {/* Question Bubbles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
              {Array.from({ length: currentExam.questionCount }).map((_, idx) => {
                const qNum = idx + 1;
                return (
                  <div key={qNum} className="flex items-center justify-between border-b border-slate-200 pb-1 text-[11px]">
                    <span className="font-bold w-7 text-right pr-1 font-mono">{qNum}.</span>
                    <div className="flex items-center gap-1.5">
                      {(["A", "B", "C", "D"] as const).map((choice) => (
                        <div
                          key={choice}
                          className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[9px] bg-white text-black"
                        >
                          {choice}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer stamp */}
            <div className="absolute bottom-6 right-8 text-[9px] text-slate-400 font-mono">
              EduMark AI OMR Standard Sheet v2026 • Form Code: {currentExam.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


