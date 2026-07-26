import React, { useState } from "react";
import { AppTab } from "../types";
import {
  Sparkles,
  Camera,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Brain,
  BarChart,
  Download,
  ArrowRight,
  Shield,
  Smartphone,
  Cpu,
  Layers,
  Zap,
  Check,
  Laptop
} from "lucide-react";

interface HeroLandingProps {
  setActiveTab: (tab: AppTab) => void;
  onOpenScanner: () => void;
  onOpenAdminLogin: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  setActiveTab,
  onOpenScanner,
  onOpenAdminLogin,
}) => {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerDownload = (fileName: string) => {
    const content = "Bộ cài đặt EduMark AI NHQ v2026 - Dành cho Giáo viên THCS Việt Nam.";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Đã tải xuống ${fileName} thành công!`);
    setDownloadModalOpen(false);
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-800">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-12 pb-16 lg:pt-20 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Công Nghệ OMR & AI Vision 2026 Cho Giáo Viên THCS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Chấm Bài Trắc Nghiệm <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500">
              Tự Động Bằng AI & QR Code
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
            Giải pháp chấm thi thông minh cho các môn Khoa học Tự nhiên, Toán, Tiếng Anh. Quét ảnh bài làm siêu tốc, tự động xử lý nét tẩy xóa mờ, quản lý mã đề và phổ điểm cực kỳ chính xác.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenScanner}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Chấm Thi Ngay (AI Scan)</span>
            </button>

            <button
              onClick={() => setActiveTab("exams")}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-6 py-3.5 rounded-2xl text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>Quản Lý Đề & Đáp Án</span>
            </button>

            <button
              onClick={() => setDownloadModalOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Tải App Máy Tính / APK</span>
            </button>
          </div>
        </div>

        {/* Mockup Preview Card */}
        <div className="mt-12 max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/90 p-3 sm:p-5 shadow-2xl relative">
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[16/9] relative flex flex-col items-center justify-center border border-slate-800">
            {/* Top Bar Mockup */}
            <div className="w-full bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-300">EduMark AI Scanner - KHTN 8 - Lớp 8A1</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                AI Ready 100%
              </span>
            </div>

            {/* Inner Dashboard Mock Content */}
            <div className="w-full h-full p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white relative">
              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Mã Bài Thi Đang Chấm</p>
                  <h3 className="text-lg font-bold text-indigo-400">EX-KHTN8-01</h3>
                  <p className="text-xs text-slate-300 mt-1">Lớp 8A1 - Sĩ số: 42 bài</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã chấm 38/42
                  </span>
                  <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-200">Độ chính xác 99.8%</span>
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Phổ Điểm Trung Bình</p>
                  <h3 className="text-2xl font-black text-emerald-400">8.25 / 10</h3>
                  <p className="text-xs text-slate-300 mt-1">Giỏi: 58% | Khá: 32% | TB: 10%</p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[85%]"></div>
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-1">Xử Lý Ngoại Lệ AI</p>
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" /> Tự động sửa vết tẩy
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Nhận diện chính xác ô tô chì ngay cả khi học sinh dùng tẩy chưa sạch.
                  </p>
                </div>
                <button
                  onClick={onOpenScanner}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-sm"
                >
                  Mở Trình Quét AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Quy Trình Chấm Thi 5 Bước Tối Ưu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Giúp giáo viên tiết kiệm 85% thời gian chấm bài thủ công mỗi kỳ kiểm tra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "1",
                title: "Tạo Đề & Đáp Án",
                desc: "Khai báo đáp án các mã đề (101, 102...), câu hỏi 20, 30, 40 hoặc 50 câu.",
                icon: Layers,
                color: "bg-blue-50 text-blue-600 border-blue-200",
              },
              {
                step: "2",
                title: "In Phiếu OMR QR",
                desc: "In phiếu trả lời có 4 điểm neo định vị và mã QR chứa SBD tự động.",
                icon: Printer,
                color: "bg-emerald-50 text-emerald-600 border-emerald-200",
              },
              {
                step: "3",
                title: "Quét Bài Bằng Camera",
                desc: "Đưa camera hoặc chọn file ảnh phiếu làm bài, tự động bắt nét alignment.",
                icon: Camera,
                color: "bg-orange-50 text-orange-600 border-orange-200",
              },
              {
                step: "4",
                title: "Phân Tích AI Vision",
                desc: "Gemini AI đọc ô tô, nhận biết vết tẩy mờ, phân tích đáp án đúng/sai.",
                icon: Brain,
                color: "bg-purple-50 text-purple-600 border-purple-200",
              },
              {
                step: "5",
                title: "Xuất Sổ Điểm Excel",
                desc: "Báo cáo phổ điểm, phân tích câu sai nhiều nhất, xuất file Excel đồng bộ.",
                icon: BarChart,
                color: "bg-cyan-50 text-cyan-600 border-cyan-200",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl relative hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold mb-3 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bước {item.step}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Admin Feature Highlight Banner */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Tính Năng Đăng Nhập Quản Trị Hệ Thống</h3>
              <p className="text-xs text-slate-300 mt-1">
                Tài khoản mặc định: <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">admin</span> / Mật khẩu: <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">admin</span>
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAdminLogin}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <span>Đăng Nhập Quản Trị Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 relative border border-slate-100">
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Tải Bộ Cài Đặt EduMark AI NHQ</h3>
              <p className="text-xs text-slate-500 mt-1">Tải bộ cài đặt tương thích thiết bị của bạn</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => triggerDownload("EduMarkAI_Setup_Windows.exe")}
                className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left flex items-center gap-3 group"
              >
                <Laptop className="w-8 h-8 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Bản Windows 10/11</p>
                  <p className="text-[10px] text-slate-500">File EduMarkAI_Setup.exe</p>
                </div>
              </button>

              <button
                onClick={() => triggerDownload("EduMarkAI_Android_v2026.apk")}
                className="p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left flex items-center gap-3 group"
              >
                <Smartphone className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Bản Điện Thoại Android</p>
                  <p className="text-[10px] text-slate-500">File EduMarkAI_v2026.apk</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
