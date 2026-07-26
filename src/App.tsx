import React, { useState, useEffect } from "react";
import { AppTab, Exam, GradedSheet, ClassRoster, AuditLog, UserAdmin } from "./types";
import {
  INITIAL_EXAMS,
  INITIAL_GRADED_SHEETS,
  INITIAL_CLASSES,
  INITIAL_AUDIT_LOGS
} from "./data/initialData";
import {
  fetchExamsFromSupabase,
  saveExamToSupabase,
  deleteExamFromSupabase,
  fetchGradedSheetsFromSupabase,
  saveGradedSheetToSupabase,
  fetchClassesFromSupabase,
  saveClassToSupabase,
  fetchAuditLogsFromSupabase,
  saveAuditLogToSupabase,
  seedInitialDataToSupabase
} from "./lib/dbService";
import { checkSupabaseConnection, supabase } from "./lib/supabase";
import { Header } from "./components/Header";
import { HeroLanding } from "./components/HeroLanding";
import { ExamManager } from "./components/ExamManager";
import { SheetGenerator } from "./components/SheetGenerator";
import { AnalyticsView } from "./components/AnalyticsView";
import { AdminPanel } from "./components/AdminPanel";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { ScannerModal } from "./components/ScannerModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [exams, setExams] = useState<Exam[]>([]);
  const [gradedSheets, setGradedSheets] = useState<GradedSheet[]>([]);
  const [classes, setClasses] = useState<ClassRoster[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);

  // Admin user state (default null until login with admin / admin)
  const [adminUser, setAdminUser] = useState<UserAdmin | null>(null);

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [printExamId, setPrintExamId] = useState<string | undefined>(undefined);

  // Load data from Supabase on startup
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromSupabase() {
      const conn = await checkSupabaseConnection();
      if (isMounted) setIsSupabaseConnected(conn.connected);

      if (conn.connected) {
        // Fetch exams strictly from Supabase
        const remoteExams = await fetchExamsFromSupabase();
        if (remoteExams && isMounted) {
          setExams(remoteExams);
        }

        // Fetch graded sheets strictly from Supabase
        const remoteSheets = await fetchGradedSheetsFromSupabase();
        if (remoteSheets && isMounted) {
          setGradedSheets(remoteSheets);
        }

        // Fetch classes strictly from Supabase
        const remoteClasses = await fetchClassesFromSupabase();
        if (remoteClasses && isMounted) {
          setClasses(remoteClasses);
        }

        // Fetch audit logs strictly from Supabase
        const remoteLogs = await fetchAuditLogsFromSupabase();
        if (remoteLogs && isMounted) {
          setAuditLogs(remoteLogs);
        }
      }
    }

    loadDataFromSupabase();

    // Subscribe to Realtime updates on graded_sheets
    const channel = supabase
      .channel("edumark-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "graded_sheets" },
        async () => {
          const freshSheets = await fetchGradedSheetsFromSupabase();
          if (freshSheets && isMounted) setGradedSheets(freshSheets);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exams" },
        async () => {
          const freshExams = await fetchExamsFromSupabase();
          if (freshExams && isMounted) setExams(freshExams);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Exam Save/Delete handlers
  const handleSaveExam = async (updatedExam: Exam) => {
    setExams((prev) => {
      const exists = prev.some((e) => e.id === updatedExam.id);
      if (exists) {
        return prev.map((e) => (e.id === updatedExam.id ? updatedExam : e));
      }
      return [updatedExam, ...prev];
    });

    // Save to Supabase
    saveExamToSupabase(updatedExam);

    // Add audit log
    const newLog: AuditLog = {
      id: "LOG-" + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toLocaleString("vi-VN"),
      action: "Cập nhật bài thi",
      user: adminUser ? adminUser.username : "Giáo viên",
      details: `Đã lưu cấu hình bài thi '${updatedExam.title}'`,
      status: "info",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveAuditLogToSupabase(newLog);
  };

  const handleDeleteExam = async (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    deleteExamFromSupabase(examId);
  };

  // Graded Sheet Save handler
  const handleSaveGradedSheet = async (newSheet: GradedSheet) => {
    setGradedSheets((prev) => [newSheet, ...prev]);
    saveGradedSheetToSupabase(newSheet);

    // Add audit log
    const newLog: AuditLog = {
      id: "LOG-" + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toLocaleString("vi-VN"),
      action: "Chấm thi OMR AI",
      user: adminUser ? adminUser.username : "Giáo viên",
      details: `Đã chấm thành công bài làm học sinh ${newSheet.studentName} (SBD: ${newSheet.studentId}) - Điểm: ${newSheet.score}`,
      status: newSheet.score >= 5 ? "success" : "warning",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveAuditLogToSupabase(newLog);
  };

  const handleOpenPrintSheet = (exam: Exam) => {
    setPrintExamId(exam.id);
    setActiveTab("sheets");
  };

  const handleAddClass = async (newClass: ClassRoster) => {
    setClasses((prev) => [...prev, newClass]);
    saveClassToSupabase(newClass);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        onLogoutAdmin={() => setAdminUser(null)}
        onQuickScan={() => setIsScannerModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Tab Content Rendering */}
      <main className="flex-1">
        {activeTab === "home" && (
          <HeroLanding
            setActiveTab={setActiveTab}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onOpenAdminLogin={() => setIsAdminModalOpen(true)}
          />
        )}

        {activeTab === "exams" && (
          <ExamManager
            exams={exams}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onOpenPrintSheet={handleOpenPrintSheet}
          />
        )}

        {activeTab === "sheets" && (
          <SheetGenerator
            exams={exams}
            classes={classes}
            selectedExamId={printExamId}
            onBack={() => setActiveTab("exams")}
          />
        )}

        {activeTab === "scan" && (
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-lg mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Mở Trình Quét AI Vision</h2>
              <p className="text-xs text-slate-500">
                Chức năng quét chấm tự động hỗ trợ chọn bài mẫu demo, tải file ảnh phiếu làm bài từ điện thoại hoặc quét camera trực tiếp.
              </p>
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md"
              >
                Mở Cửa Sổ Chấm AI
              </button>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <AnalyticsView gradedSheets={gradedSheets} exams={exams} />
        )}

        {activeTab === "admin" && (
          adminUser ? (
            <AdminPanel
              adminUser={adminUser}
              onLogoutAdmin={() => setAdminUser(null)}
              exams={exams}
              classes={classes}
              auditLogs={auditLogs}
              gradedSheets={gradedSheets}
              onAddClass={handleAddClass}
              onClearAuditLogs={handleClearAuditLogs}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto font-bold text-2xl">
                🛡️
              </div>
              <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Quyền Quản Trị</h2>
              <p className="text-xs text-slate-500">
                Bạn cần đăng nhập tài khoản Quản trị viên để truy cập bảng điều khiển hệ thống.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Mật khẩu quản trị thử nghiệm: <span className="font-mono font-bold">admin / admin</span>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs shadow-md"
              >
                Đăng Nhập Quản Trị (admin / admin)
              </button>
            </div>
          )
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setActiveTab("admin");
        }}
      />

      {/* Scanner OMR AI Modal */}
      {isScannerModalOpen && (
        <ScannerModal
          exams={exams}
          onSaveGradedSheet={handleSaveGradedSheet}
          onClose={() => setIsScannerModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-slate-700">
            &copy; 2026 EduMark AI NHQ. Hệ thống chấm thi trắc nghiệm thông minh cho Giáo dục Việt Nam.
          </p>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-600 font-bold">
              v2.5.0-AI-Vision
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
