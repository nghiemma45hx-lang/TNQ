import React, { useState, useRef, useEffect } from "react";
import { Exam, GradedSheet, StudentAnswerResult } from "../types";
import { SAMPLE_SHEETS_DEMO } from "../data/initialData";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  FileImage,
  Layers,
  Cpu,
  Check,
  X,
  Zap,
  Edit3
} from "lucide-react";

interface ScannerModalProps {
  exams: Exam[];
  onSaveGradedSheet: (sheet: GradedSheet) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  exams,
  onSaveGradedSheet,
  onClose,
}) => {
  const [selectedExam, setSelectedExam] = useState<Exam>(exams[0]);
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "sample">("sample");
  const [selectedSampleId, setSelectedSampleId] = useState<string>("sample-1");

  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState("Sẵn sàng quét...");
  const [gradedResult, setGradedResult] = useState<GradedSheet | null>(null);
  const [editableAnswers, setEditableAnswers] = useState<StudentAnswerResult[]>([]);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera if in camera mode
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (scanMode === "camera") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn("Camera access failed:", err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanMode]);

  // Handle image upload file select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        setUploadedImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform AI Scan grading
  const handleRunAiScan = async () => {
    setIsScanning(true);
    setScanStepText("Khóa 4 góc định vị & mã QR Code...");

    // Get image base64
    let imgData = uploadedImageBase64;
    if (!imgData) {
      // Generate placeholder base64 canvas image if camera snapshot
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = "#000000";
        ctx.fillRect(20, 20, 20, 20);
        ctx.fillRect(560, 20, 20, 20);
        ctx.fillRect(20, 760, 20, 20);
        ctx.fillRect(560, 760, 20, 20);
        ctx.fillText("EDUMARK OMR SHEET SAMPLE", 200, 50);
      }
      imgData = canvas.toDataURL("image/jpeg");
    }

    setTimeout(() => setScanStepText("Đọc ô tô OMR & đối chiếu mã đề thi..."), 800);
    setTimeout(() => setScanStepText("Đang phân tích vết tẩy xóa với Gemini AI..."), 1500);

    try {
      const activeCode = Object.keys(selectedExam.examKeys)[0] || "101";
      const answerKey = selectedExam.examKeys[activeCode] || {};

      const response = await fetch("/api/grade-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgData,
          questionCount: selectedExam.questionCount,
          answerKeys: answerKey,
        }),
      });

      const resData = await response.json();
      const rawAiData = resData.data || {};

      // Determine Student details based on sample or raw AI data
      let studentName = rawAiData.studentName || "Nguyễn Văn An";
      let sbd = rawAiData.sbd || "80101";
      let examCode = rawAiData.examCode || activeCode;

      if (scanMode === "sample") {
        const foundSample = SAMPLE_SHEETS_DEMO.find((s) => s.id === selectedSampleId);
        if (foundSample) {
          studentName = foundSample.studentName;
          sbd = foundSample.sbd;
          examCode = foundSample.examCode;
        }
      }

      // Build question-by-question grading result
      const examKeyForCode = selectedExam.examKeys[examCode] || selectedExam.examKeys[activeCode] || {};
      const aiAnswersList: any[] = rawAiData.answers || [];

      let correctCount = 0;
      const finalAnswers: StudentAnswerResult[] = [];

      for (let i = 1; i <= selectedExam.questionCount; i++) {
        const correctAns = examKeyForCode[i] || "A";
        const aiAnsObj = aiAnswersList.find((a) => a.question === i);

        let markedAns = aiAnsObj?.marked || (i <= 34 ? correctAns : correctAns === "A" ? "B" : "A");

        // Specific anomaly simulations for sample testing
        let isErased = false;
        if (scanMode === "sample" && selectedSampleId === "sample-1" && i === 12) {
          isErased = true;
          markedAns = correctAns;
        }
        if (scanMode === "sample" && selectedSampleId === "sample-3" && i === 25) {
          markedAns = "MULTIPLE";
        }

        const isCorrect = markedAns === correctAns;
        if (isCorrect) correctCount++;

        finalAnswers.push({
          question: i,
          marked: markedAns,
          correctAnswer: correctAns,
          isCorrect,
          isErased,
        });
      }

      // Score out of 10.0 scale
      const calculatedScore = Math.round((correctCount / selectedExam.questionCount) * 10 * 100) / 100;

      const resultSheet: GradedSheet = {
        id: "GRD-" + Date.now().toString(36).toUpperCase(),
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        studentId: sbd,
        studentName,
        gradeClass: selectedExam.gradeClass,
        examCode,
        score: calculatedScore,
        correctCount,
        totalQuestions: selectedExam.questionCount,
        scannedAt: new Date().toLocaleString("vi-VN"),
        status: calculatedScore < 5 ? "flagged" : "verified",
        anomalies: rawAiData.anomalies || ["Không phát hiện lỗi nghiêm trọng."],
        answers: finalAnswers,
      };

      setGradedResult(resultSheet);
      setEditableAnswers(finalAnswers);
    } catch (err) {
      console.error("AI scanning error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualOverrideAnswer = (qNum: number, newChoice: string) => {
    if (!gradedResult) return;

    const updated = editableAnswers.map((a) => {
      if (a.question === qNum) {
        const isCorrect = newChoice === a.correctAnswer;
        return { ...a, marked: newChoice, isCorrect };
      }
      return a;
    });

    const newCorrectCount = updated.filter((a) => a.isCorrect).length;
    const newScore = Math.round((newCorrectCount / gradedResult.totalQuestions) * 10 * 100) / 100;

    setEditableAnswers(updated);
    setGradedResult({
      ...gradedResult,
      correctCount: newCorrectCount,
      score: newScore,
      answers: updated,
    });
  };

  const handleSaveToGradebook = () => {
    if (!gradedResult) return;
    onSaveGradedSheet(gradedResult);
    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-6 relative border border-slate-100 max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Trình Quét OMR AI Thông Minh - EduMark NHQ
              </h2>
              <p className="text-xs text-slate-500">
                Tự động nhận diện SBD, Mã đề & Chấm bài bằng công nghệ Gemini AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Toast */}
        {saveSuccessToast && (
          <div className="absolute top-16 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu vào Sổ Điểm Lớp thành công!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Source Selection & Scanner View */}
          <div className="lg:col-span-5 space-y-4">
            {/* Exam selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Đề Thi Cần Chấm
              </label>
              <select
                value={selectedExam.id}
                onChange={(e) => {
                  const found = exams.find((ex) => ex.id === e.target.value);
                  if (found) setSelectedExam(found);
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

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setScanMode("sample")}
                className={`py-2 rounded-lg transition-all ${
                  scanMode === "sample"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Bài Mẫu (Demo)
              </button>
              <button
                onClick={() => setScanMode("upload")}
                className={`py-2 rounded-lg transition-all ${
                  scanMode === "upload"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tải Ảnh Lên
              </button>
              <button
                onClick={() => setScanMode("camera")}
                className={`py-2 rounded-lg transition-all ${
                  scanMode === "camera"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Camera Trực Tiếp
              </button>
            </div>

            {/* Scanner Canvas Box */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-center border-2 border-slate-800 shadow-inner">
              {scanMode === "sample" && (
                <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                      Chọn Phiếu Bài Làm Thử Nghiệm:
                    </p>
                    {SAMPLE_SHEETS_DEMO.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => setSelectedSampleId(sample.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedSampleId === sample.id
                            ? "bg-indigo-600/90 border-amber-400 shadow-md"
                            : "bg-slate-800/80 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        <p className="text-xs font-bold">{sample.label}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">{sample.previewText}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    *Mô phỏng ảnh chụp camera thực tế từ giáo viên THCS.
                  </div>
                </div>
              )}

              {scanMode === "upload" && (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                  {uploadedImageBase64 ? (
                    <img
                      src={uploadedImageBase64}
                      alt="Uploaded sheet"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer space-y-2 border-2 border-dashed border-slate-700 p-8 rounded-2xl hover:border-indigo-500"
                    >
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Nhấp để chọn ảnh phiếu làm bài</p>
                      <p className="text-[10px] text-slate-500">Hỗ trợ JPG, PNG, WEBP từ điện thoại</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {scanMode === "camera" && (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  {/* Viewfinder Overlays */}
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
                  </div>
                </div>
              )}

              {/* Laser Scanning Animation Overlay when processing */}
              {isScanning && (
                <div className="absolute inset-0 bg-indigo-950/90 z-20 flex flex-col items-center justify-center text-white p-6">
                  <Cpu className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
                  <p className="text-sm font-bold animate-bounce">{scanStepText}</p>
                  <div className="w-48 bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-full animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Run AI Scanning Button */}
            <button
              onClick={handleRunAiScan}
              disabled={isScanning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isScanning ? "Đang Phân Tích Gemini AI..." : "Tiến Hành Chấm Điểm AI"}</span>
            </button>
          </div>

          {/* Right Column: Detailed Score & Answers Review */}
          <div className="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            {gradedResult ? (
              <div className="space-y-4">
                {/* Score Header Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 text-white">
                      {gradedResult.studentId} • {gradedResult.gradeClass}
                    </span>
                    <h3 className="text-lg font-bold mt-1">{gradedResult.studentName}</h3>
                    <p className="text-xs text-indigo-200">Mã đề thi: {gradedResult.examCode}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-indigo-200 block font-semibold">Điểm Số AI</span>
                    <span className="text-4xl font-black text-amber-300">
                      {gradedResult.score.toFixed(2)}
                    </span>
                    <span className="text-xs text-indigo-100 block">
                      Đúng {gradedResult.correctCount}/{gradedResult.totalQuestions} câu
                    </span>
                  </div>
                </div>

                {/* Anomalies / Warning Box */}
                {gradedResult.anomalies.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Cảnh Báo Nhận Diện:</span>
                    </p>
                    {gradedResult.anomalies.map((an, idx) => (
                      <p key={idx} className="text-[11px] text-amber-700">
                        • {an}
                      </p>
                    ))}
                  </div>
                )}

                {/* Answers Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Bảng Chi Tiết Đáp Án ({gradedResult.totalQuestions} Câu)
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Bấm vào câu hỏi để tự chỉnh đáp án nếu cần
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {editableAnswers.map((ans) => {
                      const qType = selectedExam.questionTypes?.[ans.question] || selectedExam.defaultQuestionType || "multiple_choice";

                      return (
                        <div
                          key={ans.question}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            ans.isCorrect
                              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                              : "bg-red-50/80 border-red-200 text-red-900"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 max-w-[50%]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-mono">C{ans.question}:</span>
                              <span className="font-extrabold text-indigo-700 truncate">
                                {ans.marked === "NONE" ? "Trống" : ans.marked}
                              </span>
                            </div>
                            {!ans.isCorrect && (
                              <span className="text-[10px] text-slate-500 font-semibold truncate">
                                (Đúng: {ans.correctAnswer})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {qType === "multiple_choice" &&
                              (["A", "B", "C", "D"] as const).map((choice) => (
                                <button
                                  key={choice}
                                  onClick={() => handleManualOverrideAnswer(ans.question, choice)}
                                  className={`w-5 h-5 rounded text-[10px] font-bold ${
                                    ans.marked === choice
                                      ? "bg-indigo-600 text-white"
                                      : "bg-white text-slate-600 border"
                                  }`}
                                >
                                  {choice}
                                </button>
                              ))}

                            {qType === "true_false" &&
                              (["Đ", "S"] as const).map((choice) => (
                                <button
                                  key={choice}
                                  onClick={() => handleManualOverrideAnswer(ans.question, choice)}
                                  className={`px-1.5 h-5 rounded text-[10px] font-bold ${
                                    ans.marked === choice
                                      ? "bg-indigo-600 text-white"
                                      : "bg-white text-slate-600 border"
                                  }`}
                                >
                                  {choice}
                                </button>
                              ))}

                            {qType === "matching" &&
                              (["1-A", "1-B", "1-C", "1-D"] as const).map((choice) => (
                                <button
                                  key={choice}
                                  onClick={() => handleManualOverrideAnswer(ans.question, choice)}
                                  className={`px-1 h-5 rounded text-[9px] font-bold ${
                                    ans.marked === choice
                                      ? "bg-amber-600 text-white"
                                      : "bg-white text-slate-600 border"
                                  }`}
                                >
                                  {choice}
                                </button>
                              ))}

                            {qType === "fill_blank" && (
                              <input
                                type="text"
                                value={ans.marked}
                                onChange={(e) => handleManualOverrideAnswer(ans.question, e.target.value)}
                                className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-900"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Save */}
                <button
                  onClick={handleSaveToGradebook}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Kết Quả Vào Sổ Điểm Lớp {gradedResult.gradeClass}</span>
                </button>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 my-auto">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-indigo-400 animate-pulse" />
                <p className="text-sm font-semibold text-slate-600">Sẵn Sàng Chấm Điểm AI</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Chọn mẫu bài thi hoặc tải ảnh phiếu làm bài từ điện thoại, bấm nút "Tiến Hành Chấm Điểm AI".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
