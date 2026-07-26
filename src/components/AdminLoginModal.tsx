import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, X, Check, BookOpen, UserPlus, GraduationCap, Mail, Sparkles } from "lucide-react";
import { UserAdmin } from "../types";
import { TEACHER_SUBJECTS, TEACHER_GRADES } from "../data/subjects";
import { authenticateUser, registerNewUser } from "../lib/userService";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAdmin) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Login Form State
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);

  // Register Form State
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regSubject, setRegSubject] = useState("Ngữ văn");
  const [regCustomSubject, setRegCustomSubject] = useState("");
  const [regGrade, setRegGrade] = useState("Khối 8");
  const [regEmail, setRegEmail] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const finalSubject = regSubject === "Bộ môn Khác" ? (regCustomSubject.trim() || "Bộ môn Khác") : regSubject;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // 1. Try server endpoint
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
        onClose();
        return;
      }
    } catch (err) {
      console.warn("Backend auth fetch error, trying local user service:", err);
    }

    // 2. Fallback to local user service
    const localRes = await authenticateUser(username, password);
    setIsLoading(false);

    if (localRes.success && localRes.user) {
      onLoginSuccess(localRes.user);
      onClose();
    } else {
      setErrorMsg(localRes.message || "Tài khoản hoặc mật khẩu không đúng!");
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Mật khẩu và Nhập lại mật khẩu không trùng khớp!");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự!");
      return;
    }

    if (!regName.trim()) {
      setErrorMsg("Vui lòng nhập Họ và Tên giáo viên!");
      return;
    }

    setIsLoading(true);

    // 1. Try registering on Server backend
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword.trim(),
          name: regName.trim(),
          subject: finalSubject,
          grade: regGrade,
          email: regEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Also register in local storage to keep client state consistent
        await registerNewUser({
          username: regUsername,
          password: regPassword,
          name: regName,
          subject: finalSubject,
          grade: regGrade,
          email: regEmail,
        });

        setSuccessMsg(data.message || `Đăng ký thành công tài khoản giáo viên bộ môn ${finalSubject}!`);
        setIsLoading(false);
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 800);
        return;
      } else if (data.message) {
        setErrorMsg(data.message);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend register error, trying local register:", err);
    }

    // 2. Fallback to Local Register
    const localRes = await registerNewUser({
      username: regUsername,
      password: regPassword,
      name: regName,
      subject: finalSubject,
      grade: regGrade,
      email: regEmail,
    });

    setIsLoading(false);

    if (localRes.success && localRes.user) {
      setSuccessMsg(localRes.message);
      setTimeout(() => {
        if (localRes.user) onLoginSuccess(localRes.user);
        onClose();
      }, 800);
    } else {
      setErrorMsg(localRes.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            {authMode === "login" ? <ShieldCheck className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">
            {authMode === "login" ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản Giáo Viên"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === "login"
              ? "Đăng nhập tài khoản Giáo viên hoặc Admin để quản lý bài thi & phổ điểm"
              : "Tạo tài khoản theo Bộ môn giảng dạy để lưu vết và đồng bộ dữ liệu OMR"}
          </p>
        </div>

        {/* Auth Mode Toggle Pills */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              authMode === "login"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              authMode === "register"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đăng Ký Mới
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {authMode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên tài khoản (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập (VD: admin, teacher_van)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Help */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-indigo-900 flex items-center justify-between">
                <span>Gợi ý Tài khoản Mẫu:</span>
                <span className="text-[10px] text-indigo-600 font-normal">(Click để chọn)</span>
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setUsername("admin"); setPassword("admin"); }}
                  className="bg-white border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-100 transition-colors"
                >
                  Admin: admin / admin
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("teacher_van"); setPassword("123456"); }}
                  className="bg-white border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-100 transition-colors"
                >
                  Môn Văn: teacher_van / 123456
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("teacher_toan"); setPassword("123456"); }}
                  className="bg-white border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-100 transition-colors"
                >
                  Môn Toán: teacher_toan / 123456
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Đăng Nhập Ngay
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM 2: REGISTER */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  placeholder="giao_vien_van"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ và tên Giáo viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ThS. Nguyễn Văn A"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Bộ môn Giảng dạy *
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={regSubject}
                  onChange={(e) => setRegSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                >
                  {TEACHER_SUBJECTS.map((sb) => (
                    <option key={sb} value={sb}>
                      {sb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {regSubject === "Bộ môn Khác" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nhập tên Bộ môn của bạn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kỹ năng sống, Tin học ứng dụng..."
                  value={regCustomSubject}
                  onChange={(e) => setRegCustomSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Khối phụ trách
                </label>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {TEACHER_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  placeholder="email@truong.edu.vn"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  placeholder="Mật khẩu (>= 6 ký tự)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Xác nhận Mật khẩu *
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRegPassword}
                  onChange={(e) => setShowRegPassword(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Hiện mật khẩu</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
