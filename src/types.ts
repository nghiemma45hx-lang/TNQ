export interface AnswerKeyOption {
  question: number;
  answer: "A" | "B" | "C" | "D";
}

export interface ExamCodeKey {
  code: string; // e.g., "101", "102"
  answers: Record<number, "A" | "B" | "C" | "D">;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  gradeClass: string; // e.g. "Khối 8", "8A1"
  questionCount: number; // 20, 30, 40, 50
  durationMinutes: number;
  createdAt: string;
  examKeys: Record<string, Record<number, "A" | "B" | "C" | "D">>; // code -> { qNum: ans }
  status: "draft" | "active" | "archived";
}

export interface StudentAnswerResult {
  question: number;
  marked: string; // "A" | "B" | "C" | "D" | "NONE" | "MULTIPLE"
  correctAnswer: string;
  isCorrect: boolean;
  isErased?: boolean;
  confidence?: number;
}

export interface GradedSheet {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string; // SBD
  studentName: string;
  gradeClass: string;
  examCode: string; // e.g. "101"
  score: number; // 0.0 to 10.0
  correctCount: number;
  totalQuestions: number;
  scannedAt: string;
  imageThumbnail?: string;
  answers: StudentAnswerResult[];
  anomalies: string[];
  status: "auto_graded" | "verified" | "flagged";
}

export interface Student {
  sbd: string;
  name: string;
  gradeClass: string;
  gender: "Nam" | "Nữ";
  birthDate?: string;
  notes?: string;
}

export interface ClassRoster {
  id: string;
  className: string;
  grade: string;
  academicYear: string;
  studentCount: number;
  students: Student[];
}

export interface UserAdmin {
  username: string;
  role: string;
  name: string;
  email: string;
  avatar: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  status: "success" | "warning" | "info";
}

export type AppTab = "home" | "exams" | "scan" | "sheets" | "analytics" | "admin";
