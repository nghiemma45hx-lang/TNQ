import React, { useState, useRef, useEffect } from "react";
import { Exam } from "../types";
import { Printer, Download, QrCode, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface SheetGeneratorProps {
  exams: Exam[];
  selectedExamId?: string;
  onBack?: () => void;
}

export const SheetGenerator: React.FC<SheetGeneratorProps> = ({
  exams,
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

  const sheetRef = useRef<HTMLDivElement>(null);

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

  const handlePrintBrowser = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccessMsg(null);

    try {
      // Small pause to ensure layout & QR code rendered
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = sheetRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution (300 DPI equivalent)
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        onclone: (clonedDoc) => {
          // Replace oklch(...) color functions in cloned document stylesheets to prevent html2canvas color parsing errors
          // DO NOT delete rules, only replace oklch color values with valid rgb color
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

      // Create PDF in A4 Portrait mode (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image scaled to fit A4 page width
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
              className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
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
        {/* Left Form: Parameters */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thiết Lập Thông Tin Phiếu</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn Bài Thi</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ & Tên Học Sinh</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp Học</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Báo Danh (SBD)</label>
              <input
                type="text"
                value={sbd}
                onChange={(e) => setSbd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Đề Thi</label>
              <select
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {Object.keys(currentExam.examKeys).map((code) => (
                  <option key={code} value={code}>
                    Mã Đề {code}
                  </option>
                ))}
              </select>
            </div>
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

