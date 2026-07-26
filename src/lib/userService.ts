import { UserAccount } from "../types";
import { supabase } from "./supabase";

const LOCAL_STORAGE_USERS_KEY = "edumark_registered_user_accounts";
const CURRENT_LOGGED_USER_KEY = "edumark_current_logged_user";

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: "USER-ADMIN",
    username: "admin",
    password: "admin",
    name: "Quản trị viên EduMark",
    role: "Administrator",
    subject: "Quản trị Hệ thống",
    grade: "Tất cả các khối",
    email: "admin@edumark.edu.vn",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01 08:00:00",
  },
  {
    id: "USER-TEACHER-1",
    username: "teacher_van",
    password: "123456",
    name: "Cô Nguyễn Thị Mai",
    role: "Giáo viên",
    subject: "Ngữ văn",
    grade: "Khối 8",
    email: "mainguyen@edumark.edu.vn",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    createdAt: "2026-02-10 09:30:00",
  },
  {
    id: "USER-TEACHER-2",
    username: "teacher_toan",
    password: "123456",
    name: "Thầy Trần Hoàng Nam",
    role: "Giáo viên",
    subject: "Toán học",
    grade: "Khối 9",
    email: "namtran@edumark.edu.vn",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80",
    createdAt: "2026-02-15 14:20:00",
  },
  {
    id: "USER-TEACHER-3",
    username: "teacher_anh",
    password: "123456",
    name: "Cô Lê Khánh Linh",
    role: "Giáo viên",
    subject: "Tiếng Anh",
    grade: "Khối 7",
    email: "linhle@edumark.edu.vn",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    createdAt: "2026-03-01 10:15:00",
  }
];

// Helper to get all users from LocalStorage
export function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to load local users, resetting to defaults:", err);
  }
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
}

// Save users to LocalStorage
export function saveLocalUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save local users:", err);
  }
}

// Get currently persisted session user
export function getPersistedSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_LOGGED_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read current session user:", err);
  }
  return null;
}

export function setPersistedSessionUser(user: UserAccount | null) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_LOGGED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_LOGGED_USER_KEY);
    }
  } catch (err) {
    console.error("Failed to set session user:", err);
  }
}

// Fetch all users from Supabase with LocalStorage fallback
export async function fetchAllUsers(): Promise<UserAccount[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const dbUsers: UserAccount[] = data.map((row: any) => ({
        id: row.id || `USER-${row.username}`,
        username: row.username,
        password: row.password || "123456",
        name: row.name || row.full_name || row.username,
        role: row.role || "Giáo viên",
        subject: row.subject || "Khác",
        grade: row.grade || "Khối 8",
        email: row.email || `${row.username}@edumark.edu.vn`,
        avatar: row.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        createdAt: row.created_at || new Date().toLocaleString("vi-VN"),
      }));

      // Merge with local users so no accounts get lost
      const localUsers = getLocalUsers();
      const mergedMap = new Map<string, UserAccount>();
      dbUsers.forEach((u) => mergedMap.set(u.username, u));
      localUsers.forEach((u) => {
        if (!mergedMap.has(u.username)) {
          mergedMap.set(u.username, u);
        }
      });
      const merged = Array.from(mergedMap.values());
      saveLocalUsers(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase fetch users failed, falling back to localStorage:", err);
  }

  return getLocalUsers();
}

// Register a new Teacher account
export async function registerNewUser(newAcc: {
  username: string;
  password: string;
  name: string;
  subject: string;
  grade?: string;
  email?: string;
}): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const usernameClean = newAcc.username.trim().toLowerCase();
  const passwordClean = newAcc.password.trim();

  if (!usernameClean || usernameClean.length < 3) {
    return { success: false, message: "Tên đăng nhập phải chứa ít nhất 3 ký tự!" };
  }
  if (!passwordClean || passwordClean.length < 6) {
    return { success: false, message: "Mật khẩu phải dài từ 6 ký tự trở lên!" };
  }
  if (!newAcc.name.trim()) {
    return { success: false, message: "Vui lòng nhập Họ và Tên giáo viên!" };
  }
  if (!newAcc.subject.trim()) {
    return { success: false, message: "Vui lòng chọn hoặc nhập Bộ môn giảng dạy!" };
  }

  const allUsers = getLocalUsers();
  const exists = allUsers.some((u) => u.username.toLowerCase() === usernameClean);
  if (exists) {
    return { success: false, message: `Tên tài khoản '${usernameClean}' đã tồn tại. Vui lòng chọn tên khác!` };
  }

  const createdUser: UserAccount = {
    id: "USER-" + Date.now().toString(36).toUpperCase(),
    username: usernameClean,
    password: passwordClean,
    name: newAcc.name.trim(),
    subject: newAcc.subject.trim(),
    grade: newAcc.grade || "Tất cả các khối",
    role: "Giáo viên",
    email: newAcc.email?.trim() || `${usernameClean}@edumark.edu.vn`,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    createdAt: new Date().toLocaleString("vi-VN"),
    lastLogin: new Date().toLocaleString("vi-VN"),
  };

  // Save to LocalStorage
  const updatedList = [createdUser, ...allUsers];
  saveLocalUsers(updatedList);

  // Attempt to save to Supabase
  try {
    await supabase.from("users").upsert({
      id: createdUser.id,
      username: createdUser.username,
      password: createdUser.password,
      name: createdUser.name,
      role: createdUser.role,
      subject: createdUser.subject,
      grade: createdUser.grade,
      email: createdUser.email,
      avatar: createdUser.avatar,
    });
  } catch (e) {
    console.warn("Could not sync new user to Supabase:", e);
  }

  return {
    success: true,
    message: `Đăng ký thành công tài khoản Bộ môn ${createdUser.subject}!`,
    user: createdUser,
  };
}

// Login user account
export async function authenticateUser(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const usernameClean = usernameInput.trim().toLowerCase();
  const passwordClean = passwordInput.trim();

  const users = await fetchAllUsers();
  const found = users.find(
    (u) => u.username.toLowerCase() === usernameClean && u.password === passwordClean
  );

  if (found) {
    const updatedUser: UserAccount = {
      ...found,
      lastLogin: new Date().toLocaleString("vi-VN"),
    };

    // Update lastLogin locally
    const updatedList = users.map((u) => (u.username === found.username ? updatedUser : u));
    saveLocalUsers(updatedList);
    setPersistedSessionUser(updatedUser);

    return {
      success: true,
      message: "Đăng nhập thành công!",
      user: updatedUser,
    };
  }

  return {
    success: false,
    message: "Tên đăng nhập hoặc Mật khẩu không đúng!",
  };
}

// Change Password
export function changeUserPassword(
  username: string,
  oldPass: string,
  newPass: string
): { success: boolean; message: string } {
  if (!newPass || newPass.trim().length < 6) {
    return { success: false, message: "Mật khẩu mới phải dài từ 6 ký tự trở lên!" };
  }

  const users = getLocalUsers();
  const userIdx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return { success: false, message: "Không tìm thấy tài khoản người dùng!" };
  }

  if (users[userIdx].password !== oldPass.trim()) {
    return { success: false, message: "Mật khẩu hiện tại không chính xác!" };
  }

  users[userIdx].password = newPass.trim();
  saveLocalUsers(users);

  // If current session user is updating
  const currentSession = getPersistedSessionUser();
  if (currentSession && currentSession.username.toLowerCase() === username.toLowerCase()) {
    setPersistedSessionUser({ ...currentSession, password: newPass.trim() });
  }

  // Update Supabase in background
  supabase.from("users").update({ password: newPass.trim() }).eq("username", username).then();

  return { success: true, message: "Cập nhật mật khẩu thành công!" };
}

// Update User Profile (Subject, Name, Grade)
export function updateUserProfileInfo(
  username: string,
  updatedData: { name?: string; subject?: string; grade?: string; email?: string }
): { success: boolean; message: string; user?: UserAccount } {
  const users = getLocalUsers();
  const userIdx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return { success: false, message: "Không tìm thấy người dùng!" };
  }

  if (updatedData.name) users[userIdx].name = updatedData.name.trim();
  if (updatedData.subject) users[userIdx].subject = updatedData.subject.trim();
  if (updatedData.grade) users[userIdx].grade = updatedData.grade.trim();
  if (updatedData.email) users[userIdx].email = updatedData.email.trim();

  saveLocalUsers(users);

  const updatedUser = users[userIdx];

  // Update session
  const currentSession = getPersistedSessionUser();
  if (currentSession && currentSession.username.toLowerCase() === username.toLowerCase()) {
    setPersistedSessionUser(updatedUser);
  }

  // Sync with Supabase
  supabase.from("users").update({
    name: updatedUser.name,
    subject: updatedUser.subject,
    grade: updatedUser.grade,
    email: updatedUser.email
  }).eq("username", username).then();

  return {
    success: true,
    message: "Cập nhật thông tin tài khoản thành công!",
    user: updatedUser,
  };
}

// Admin delete user
export function deleteUserByAdmin(username: string): { success: boolean; message: string } {
  if (username.toLowerCase() === "admin") {
    return { success: false, message: "Không thể xóa tài khoản Quản trị viên tối cao (admin)!" };
  }

  const users = getLocalUsers();
  const filtered = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  saveLocalUsers(filtered);

  // Sync Supabase
  supabase.from("users").delete().eq("username", username).then();

  return { success: true, message: `Đã xóa tài khoản ${username} thành công.` };
}
