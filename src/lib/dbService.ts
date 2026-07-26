import { supabase } from "./supabase";
import { Exam, GradedSheet, ClassRoster, AuditLog } from "../types";

// Key constants for local fallback
const LOCAL_STORAGE_KEYS = {
  EXAMS: "edumark_supabase_fallback_exams",
  GRADED_SHEETS: "edumark_supabase_fallback_graded_sheets",
  CLASSES: "edumark_supabase_fallback_classes",
  AUDIT_LOGS: "edumark_supabase_fallback_audit_logs",
};

// ----------------------------------------------------
// 1. EXAMS SERVICE
// ----------------------------------------------------
export async function fetchExamsFromSupabase(): Promise<Exam[] | null> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch exams error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      gradeClass: row.grade_class || row.gradeClass || "Khối 8",
      questionCount: row.question_count || row.questionCount || 40,
      durationMinutes: row.duration_minutes || row.durationMinutes || 45,
      createdAt: row.created_at || new Date().toISOString(),
      examKeys: row.exam_keys || row.examKeys || {},
      status: row.status || "active",
    }));
  } catch (err) {
    console.warn("Exception fetching exams from Supabase:", err);
    return null;
  }
}

export async function saveExamToSupabase(exam: Exam): Promise<boolean> {
  try {
    const dbPayload = {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      grade_class: exam.gradeClass,
      question_count: exam.questionCount,
      duration_minutes: exam.durationMinutes,
      exam_keys: exam.examKeys,
      status: exam.status,
    };

    const { error } = await supabase.from("exams").upsert(dbPayload);

    if (error) {
      console.warn("Supabase upsert exam error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving exam to Supabase:", err);
    return false;
  }
}

export async function deleteExamFromSupabase(examId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("exams").delete().eq("id", examId);
    if (error) {
      console.warn("Supabase delete exam error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception deleting exam from Supabase:", err);
    return false;
  }
}

// ----------------------------------------------------
// 2. GRADED SHEETS SERVICE
// ----------------------------------------------------
export async function fetchGradedSheetsFromSupabase(): Promise<GradedSheet[] | null> {
  try {
    const { data, error } = await supabase
      .from("graded_sheets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch graded sheets error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      examId: row.exam_id || row.examId,
      examTitle: row.exam_title || row.examTitle,
      studentId: row.student_id || row.studentId,
      studentName: row.student_name || row.studentName,
      gradeClass: row.grade_class || row.gradeClass,
      examCode: row.exam_code || row.examCode,
      score: Number(row.score),
      correctCount: row.correct_count || row.correctCount,
      totalQuestions: row.total_questions || row.totalQuestions,
      scannedAt: row.scanned_at || row.scannedAt,
      imageThumbnail: row.image_thumbnail || row.imageThumbnail,
      answers: row.answers || [],
      anomalies: row.anomalies || [],
      status: row.status || "verified",
    }));
  } catch (err) {
    console.warn("Exception fetching graded sheets from Supabase:", err);
    return null;
  }
}

export async function saveGradedSheetToSupabase(sheet: GradedSheet): Promise<boolean> {
  try {
    const dbPayload = {
      id: sheet.id,
      exam_id: sheet.examId,
      exam_title: sheet.examTitle,
      student_id: sheet.studentId,
      student_name: sheet.studentName,
      grade_class: sheet.gradeClass,
      exam_code: sheet.examCode,
      score: sheet.score,
      correct_count: sheet.correctCount,
      total_questions: sheet.totalQuestions,
      scanned_at: sheet.scannedAt,
      image_thumbnail: sheet.imageThumbnail || null,
      answers: sheet.answers,
      anomalies: sheet.anomalies,
      status: sheet.status,
    };

    const { error } = await supabase.from("graded_sheets").upsert(dbPayload);

    if (error) {
      console.warn("Supabase upsert graded sheet error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving graded sheet to Supabase:", err);
    return false;
  }
}

// Local Storage Fallback Helpers for Classes
export function fetchClassesFromLocalStorage(): ClassRoster[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read classes from localStorage:", err);
  }
  return [];
}

export function saveClassToLocalStorage(cls: ClassRoster): void {
  try {
    const existing = fetchClassesFromLocalStorage();
    const idx = existing.findIndex((c) => c.id === cls.id || c.className === cls.className);
    if (idx >= 0) {
      existing[idx] = cls;
    } else {
      existing.unshift(cls);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLASSES, JSON.stringify(existing));
  } catch (err) {
    console.warn("Failed to save class to localStorage:", err);
  }
}

export function deleteClassFromLocalStorage(classId: string): void {
  try {
    const existing = fetchClassesFromLocalStorage();
    const filtered = existing.filter((c) => c.id !== classId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLASSES, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete class from localStorage:", err);
  }
}

// ----------------------------------------------------
// 3. CLASSES SERVICE
// ----------------------------------------------------
export async function fetchClassesFromSupabase(): Promise<ClassRoster[] | null> {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch classes error:", error.message);
      const local = fetchClassesFromLocalStorage();
      return local.length > 0 ? local : null;
    }

    if (!data || data.length === 0) {
      const local = fetchClassesFromLocalStorage();
      if (local.length > 0) return local;
      return [];
    }

    const remoteClasses = data.map((row: any) => ({
      id: row.id,
      className: row.class_name || row.className,
      grade: row.grade,
      academicYear: row.academic_year || row.academicYear,
      studentCount: row.student_count || row.studentCount || (row.students?.length || 0),
      students: row.students || [],
    }));

    // Keep localStorage in sync
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CLASSES, JSON.stringify(remoteClasses));
    } catch (e) {}

    return remoteClasses;
  } catch (err) {
    console.warn("Exception fetching classes from Supabase:", err);
    const local = fetchClassesFromLocalStorage();
    return local.length > 0 ? local : null;
  }
}

export async function saveClassToSupabase(cls: ClassRoster): Promise<boolean> {
  // Always persist to local storage as instant offline backup
  saveClassToLocalStorage(cls);

  try {
    const dbPayload = {
      id: cls.id,
      class_name: cls.className,
      grade: cls.grade,
      academic_year: cls.academicYear,
      student_count: cls.studentCount || cls.students.length,
      students: cls.students,
    };

    const { error } = await supabase.from("classes").upsert(dbPayload);

    if (error) {
      console.warn("Supabase upsert class error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving class to Supabase:", err);
    return false;
  }
}

export async function deleteClassFromSupabase(classId: string): Promise<boolean> {
  deleteClassFromLocalStorage(classId);

  try {
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) {
      console.warn("Supabase delete class error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception deleting class from Supabase:", err);
    return false;
  }
}

// ----------------------------------------------------
// 4. AUDIT LOGS SERVICE
// ----------------------------------------------------
export async function fetchAuditLogsFromSupabase(): Promise<AuditLog[] | null> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Supabase fetch audit logs error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      user: row.user,
      details: row.details,
      status: row.status,
    }));
  } catch (err) {
    console.warn("Exception fetching audit logs from Supabase:", err);
    return null;
  }
}

export async function saveAuditLogToSupabase(log: AuditLog): Promise<boolean> {
  try {
    const dbPayload = {
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      user: log.user,
      details: log.details,
      status: log.status,
    };

    const { error } = await supabase.from("audit_logs").upsert(dbPayload);

    if (error) {
      console.warn("Supabase upsert audit log error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving audit log to Supabase:", err);
    return false;
  }
}

// ----------------------------------------------------
// 5. BULK SEEDING INITIAL DATA TO SUPABASE
// ----------------------------------------------------
export async function seedInitialDataToSupabase(
  initialExams: Exam[],
  initialSheets: GradedSheet[],
  initialClasses: ClassRoster[],
  initialLogs: AuditLog[]
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Exams
    for (const ex of initialExams) {
      await saveExamToSupabase(ex);
    }

    // 2. Seed Graded Sheets
    for (const sheet of initialSheets) {
      await saveGradedSheetToSupabase(sheet);
    }

    // 3. Seed Classes
    for (const cls of initialClasses) {
      await saveClassToSupabase(cls);
    }

    // 4. Seed Audit Logs
    for (const log of initialLogs) {
      await saveAuditLogToSupabase(log);
    }

    return {
      success: true,
      message: "Đồng bộ toàn bộ dữ liệu mẫu lên cơ sở dữ liệu Supabase thành công!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi khi đồng bộ dữ liệu lên Supabase: ${err.message}`,
    };
  }
}
