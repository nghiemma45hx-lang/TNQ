import { Exam, GradedSheet, ClassRoster, AuditLog } from "../types";

export const INITIAL_EXAMS: Exam[] = [
  {
    id: "EX-KHTN8-01",
    title: "Kiểm Tra Khảo Sát KHTN 8 - Giữa Kỳ 2",
    subject: "Khoa học Tự nhiên",
    gradeClass: "Khối 8",
    questionCount: 40,
    durationMinutes: 45,
    createdAt: "2026-03-15",
    status: "active",
    examKeys: {
      "101": {
        1: "A", 2: "C", 3: "B", 4: "D", 5: "A", 6: "B", 7: "C", 8: "D", 9: "A", 10: "C",
        11: "B", 12: "C", 13: "D", 14: "A", 15: "B", 16: "C", 17: "A", 18: "D", 19: "B", 20: "C",
        21: "D", 22: "A", 23: "C", 24: "B", 25: "D", 26: "A", 27: "B", 28: "C", 29: "D", 30: "A",
        31: "B", 32: "C", 33: "D", 34: "A", 35: "B", 36: "C", 37: "D", 38: "A", 39: "B", 40: "C"
      },
      "102": {
        1: "B", 2: "D", 3: "A", 4: "C", 5: "B", 6: "C", 7: "D", 8: "A", 9: "B", 10: "D",
        11: "C", 12: "A", 13: "B", 14: "D", 15: "C", 16: "A", 17: "B", 18: "C", 19: "D", 20: "A",
        21: "C", 22: "B", 23: "D", 24: "A", 25: "C", 26: "B", 27: "A", 28: "D", 29: "C", 30: "B",
        31: "A", 32: "D", 33: "C", 34: "B", 35: "A", 36: "D", 37: "C", 38: "B", 39: "A", 40: "D"
      }
    }
  },
  {
    id: "EX-TOAN9-02",
    title: "Kiểm Tra Thường Xuyên Toán 9 - Đại Số & Hình Học",
    subject: "Toán Học",
    gradeClass: "Khối 9",
    questionCount: 20,
    durationMinutes: 30,
    createdAt: "2026-03-10",
    status: "active",
    examKeys: {
      "201": {
        1: "A", 2: "B", 3: "C", 4: "D", 5: "A", 6: "A", 7: "B", 8: "C", 9: "D", 10: "B",
        11: "C", 12: "D", 13: "A", 14: "B", 15: "C", 16: "D", 17: "A", 18: "B", 19: "C", 20: "D"
      }
    }
  },
  {
    id: "EX-ENG7-03",
    title: "English 7 Unit 8 Test (Global Success)",
    subject: "Tiếng Anh",
    gradeClass: "Khối 7",
    questionCount: 30,
    durationMinutes: 45,
    createdAt: "2026-02-28",
    status: "active",
    examKeys: {
      "301": {
        1: "C", 2: "A", 3: "D", 4: "B", 5: "C", 6: "A", 7: "D", 8: "B", 9: "C", 10: "A",
        11: "D", 12: "B", 13: "C", 14: "A", 15: "D", 16: "B", 17: "C", 18: "A", 19: "D", 20: "B",
        21: "C", 22: "A", 23: "D", 24: "B", 25: "C", 26: "A", 27: "D", 28: "B", 29: "C", 30: "A"
      }
    }
  }
];

export const INITIAL_CLASSES: ClassRoster[] = [
  {
    id: "CLS-8A1",
    className: "8A1",
    grade: "Khối 8",
    academicYear: "2025-2026",
    studentCount: 42,
    students: [
      { sbd: "80101", name: "Nguyễn Văn An", gradeClass: "8A1", gender: "Nam" },
      { sbd: "80102", name: "Trần Thị Bích", gradeClass: "8A1", gender: "Nữ" },
      { sbd: "80103", name: "Lê Cường", gradeClass: "8A1", gender: "Nam" },
      { sbd: "80104", name: "Phạm Hoàng Dung", gradeClass: "8A1", gender: "Nữ" },
      { sbd: "80105", name: "Đỗ Minh Đức", gradeClass: "8A1", gender: "Nam" },
      { sbd: "80106", name: "Vũ Phương Thảo", gradeClass: "8A1", gender: "Nữ" },
      { sbd: "80107", name: "Hoàng Gia Bảo", gradeClass: "8A1", gender: "Nam" },
      { sbd: "80108", name: "Bùi Tuyết Nhi", gradeClass: "8A1", gender: "Nữ" },
    ]
  },
  {
    id: "CLS-9A2",
    className: "9A2",
    grade: "Khối 9",
    academicYear: "2025-2026",
    studentCount: 38,
    students: [
      { sbd: "90201", name: "Đặng Tuấn Anh", gradeClass: "9A2", gender: "Nam" },
      { sbd: "90202", name: "Ngô Linh Chi", gradeClass: "9A2", gender: "Nữ" },
      { sbd: "90203", name: "Trịnh Quốc Việt", gradeClass: "9A2", gender: "Nam" },
    ]
  }
];

export const INITIAL_GRADED_SHEETS: GradedSheet[] = [
  {
    id: "GRD-80101-KHTN8",
    examId: "EX-KHTN8-01",
    examTitle: "Kiểm Tra Khảo Sát KHTN 8 - Giữa Kỳ 2",
    studentId: "80101",
    studentName: "Nguyễn Văn An",
    gradeClass: "8A1",
    examCode: "101",
    score: 8.5,
    correctCount: 34,
    totalQuestions: 40,
    scannedAt: "2026-03-15 09:15",
    status: "verified",
    anomalies: ["Phát hiện vết tẩy xóa mờ ở câu 12 (Đã xử lý đúng chọn C)"],
    answers: Array.from({ length: 40 }, (_, i) => {
      const q = i + 1;
      const key = INITIAL_EXAMS[0].examKeys["101"][q];
      const isCorrect = q <= 34;
      return {
        question: q,
        marked: isCorrect ? key : key === "A" ? "B" : "A",
        correctAnswer: key,
        isCorrect,
        isErased: q === 12
      };
    })
  },
  {
    id: "GRD-80102-KHTN8",
    examId: "EX-KHTN8-01",
    examTitle: "Kiểm Tra Khảo Sát KHTN 8 - Giữa Kỳ 2",
    studentId: "80102",
    studentName: "Trần Thị Bích",
    gradeClass: "8A1",
    examCode: "101",
    score: 9.25,
    correctCount: 37,
    totalQuestions: 40,
    scannedAt: "2026-03-15 09:18",
    status: "verified",
    anomalies: [],
    answers: Array.from({ length: 40 }, (_, i) => {
      const q = i + 1;
      const key = INITIAL_EXAMS[0].examKeys["101"][q];
      const isCorrect = q !== 10 && q !== 20 && q !== 30;
      return {
        question: q,
        marked: isCorrect ? key : "D",
        correctAnswer: key,
        isCorrect
      };
    })
  },
  {
    id: "GRD-80103-KHTN8",
    examId: "EX-KHTN8-01",
    examTitle: "Kiểm Tra Khảo Sát KHTN 8 - Giữa Kỳ 2",
    studentId: "80103",
    studentName: "Lê Cường",
    gradeClass: "8A1",
    examCode: "102",
    score: 6.75,
    correctCount: 27,
    totalQuestions: 40,
    scannedAt: "2026-03-15 09:22",
    status: "flagged",
    anomalies: ["Cảnh báo: Học sinh tô 2 ô đè lên nhau ở câu 25"],
    answers: Array.from({ length: 40 }, (_, i) => {
      const q = i + 1;
      const key = INITIAL_EXAMS[0].examKeys["102"][q];
      const isCorrect = q <= 27;
      return {
        question: q,
        marked: q === 25 ? "MULTIPLE" : isCorrect ? key : "A",
        correctAnswer: key,
        isCorrect: isCorrect && q !== 25
      };
    })
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-03-15 09:22:10",
    action: "Chấm thi OMR AI",
    user: "admin",
    details: "Đã chấm thành công bài làm học sinh Lê Cường (SBD: 80103) - Điểm: 6.75",
    status: "warning"
  },
  {
    id: "LOG-002",
    timestamp: "2026-03-15 09:18:04",
    action: "Chấm thi OMR AI",
    user: "admin",
    details: "Đã chấm thành công bài làm học sinh Trần Thị Bích (SBD: 80102) - Điểm: 9.25",
    status: "success"
  },
  {
    id: "LOG-003",
    timestamp: "2026-03-15 08:30:00",
    action: "Đăng nhập hệ thống",
    user: "admin",
    details: "Đăng nhập Quản trị viên thành công từ địa chỉ 192.168.1.10",
    status: "info"
  },
  {
    id: "LOG-004",
    timestamp: "2026-03-15 08:15:20",
    action: "Tạo bài thi mới",
    user: "admin",
    details: "Khởi tạo bài thi 'Kiểm Tra Khảo Sát KHTN 8' với 2 mã đề (101, 102)",
    status: "info"
  }
];

// Sample test sheet image presets for quick testing
export const SAMPLE_SHEETS_DEMO = [
  {
    id: "sample-1",
    label: "Bài thi 8A1 - Nguyễn Văn An (8.5đ, có tẩy xóa)",
    studentName: "Nguyễn Văn An",
    sbd: "80101",
    examCode: "101",
    bgGradient: "from-blue-600 to-indigo-800",
    previewText: "Phiếu 40 câu - Tô đẹp - 1 vết tẩy mờ câu 12"
  },
  {
    id: "sample-2",
    label: "Bài thi 8A1 - Trần Thị Bích (9.25đ, bài đẹp)",
    studentName: "Trần Thị Bích",
    sbd: "80102",
    examCode: "101",
    bgGradient: "from-emerald-600 to-teal-800",
    previewText: "Phiếu 40 câu - Tô chì chuẩn - 37/40 đúng"
  },
  {
    id: "sample-3",
    label: "Bài thi 8A1 - Lê Cường (6.75đ, lỗi tô 2 ô câu 25)",
    studentName: "Lê Cường",
    sbd: "80103",
    examCode: "102",
    bgGradient: "from-purple-600 to-pink-800",
    previewText: "Phiếu 40 câu - Cảnh báo lỗi tô 2 ô đè"
  }
];
