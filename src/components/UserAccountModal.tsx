import React, { useState } from "react";
import { X, User, BookOpen, Key, Lock, Eye, EyeOff, Check, AlertCircle, Shield, LogOut, Sparkles, GraduationCap } from "lucide-react";
import { UserAdmin } from "../types";
import { TEACHER_SUBJECTS, TEACHER_GRADES } from "../data/subjects";
import { changeUserPassword, updateUserProfileInfo } from "../lib/userService";

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAdmin;
  onUpdateUser: (updatedUser: UserAdmin) => void;
  onLogout: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "edit" | "password">("info");

  // Edit Profile Form
  const [name, setName] = useState(currentUser.name || "");
  const [subject, setSubject] = useState(currentUser.subject || "Ngữ văn");
  const [customSubject, setCustomSubject] = useState("");
  const [grade, setGrade] = useState(currentUser.grade || "Khối 8");
  const [email, setEmail] = useState(currentUser.email || "");

  // Change Password Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const finalSubject = subject === "Bộ môn Khác" ? (customSubject.trim() || "Bộ môn Khác") : subject;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsLoading(true);

    const res = updateUserProfileInfo(currentUser.username, {
      name,
      subject: finalSubject,
      grade,
      email,
    });

    setIsLoading(false);
    if (res.success && res.user) {
      setStatusMsg({ type: "success", text: "Đã cập nhật thông tin tài khoản & Bộ môn thành công!" });
      onUpdateUser(res.user);
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", text: "Mật khẩu mới và Nhập lại mật khẩu không khớp!" });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMsg({ type: "error", text: "Mật khẩu mới phải dài tối thiểu 6 ký tự!" });
      return;
    }

    setIsLoading(true);
    const res = changeUserPassword(currentUser.username, oldPassword, newPassword);
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Avatar & Name */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-100 shadow-md mx-auto"
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Môn: {currentUser.subject || "Chưa chọn bộ môn"}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab("info"); setStatusMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "info" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Thông Tin
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("edit"); setStatusMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "edit" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sửa Hồ Sơ & Bộ Môn
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("password"); setStatusMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "password" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Status Message Toast */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: INFO */}
        {activeTab === "info" && (
          <div className="space-y-3 text-xs text-slate-700">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-slate-800">@{currentUser.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Bộ môn giảng dạy:</span>
                <span className="font-bold text-indigo-700">{currentUser.subject || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Khối lớp phụ trách:</span>
                <span className="font-bold text-slate-800">{currentUser.grade || "Khối 8"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{currentUser.email || "Chưa có"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Vai trò hệ thống:</span>
                <span className="font-bold text-emerald-700">{currentUser.role}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl border border-red-200 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE & SUBJECT */}
        {activeTab === "edit" && (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và Tên Giáo Viên
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bộ Môn Giảng Dạy
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {TEACHER_SUBJECTS.map((sb) => (
                    <option key={sb} value={sb}>
                      {sb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subject === "Bộ môn Khác" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập tên Bộ Môn của bạn
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Âm nhạc, Mỹ thuật, Kỹ năng sống..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khối Giảng Dạy Phụ Trách
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {TEACHER_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cập Nhật Hồ Sơ</span>
            </button>
          </form>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật Khẩu Hiện Tại
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showOldPass ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật Khẩu Mới (Tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Đổi Mật Khẩu Tức Thì</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
