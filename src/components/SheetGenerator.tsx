import React, { useState, useRef, useEffect } from "react";
import { Exam, ClassRoster } from "../types";
import {
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Shuffle,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Sparkles,
  FileText,
  RotateCcw,
  Trash2,
  UserPlus,
  Save,
  Edit3,
} from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, ImageRun, AlignmentType } from "docx";

interface SheetGeneratorProps {
  exams: Exam[];
  classes?: ClassRoster[];
  selectedExamId?: string;
  onBack?: () => void;
  onSaveClass?: (newClass: ClassRoster) => void;
  onDeleteClass?: (classId: string) => void;
}

interface LoadedStudent {
  sbd: string;
  name: string;
  className: string;
  examCode: string;
}

export const SheetGenerator: React.FC<SheetGeneratorProps> = ({
  exams,
  classes = [],
  selectedExamId,
  onBack,
  onSaveClass,
  onDeleteClass,
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
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState<string | null>(null);

  // Student list state (from uploaded CSV or selected class)
  const [studentList, setStudentList] = useState<LoadedStudent[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo History Stack for Student Edits & Deletions
  interface UndoState {
    studentList: LoadedStudent[];
    selectedStudentIdx: number;
    studentName: string;
    className: string;
    sbd: string;
    examCode: string;
    description: string;
  }

  const [undoStack, setUndoStack] = useState<UndoState[]>([]);

  const pushUndoSnapshot = (description: string) => {
    setUndoStack((prev) => [
      ...prev.slice(-15),
      {
        studentList: [...studentList],
        selectedStudentIdx,
        studentName,
        className,
        sbd,
        examCode,
        description,
      },
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    setStudentList(lastState.studentList);
    const restoredIdx = Math.min(
      Math.max(0, lastState.selectedStudentIdx),
      Math.max(0, lastState.studentList.length - 1)
    );
    setSelectedStudentIdx(restoredIdx);

    setStudentName(lastState.studentName);
    setClassName(lastState.className);
    setSbd(lastState.sbd);
    setExamCode(lastState.examCode);

    try {
      localStorage.setItem(
        "edumark_active_sheet_students",
        JSON.stringify(lastState.studentList)
      );
    } catch (e) {}

    setPdfSuccessMsg(`Đã HOÀN TÁC thành công: "${lastState.description}"`);
    setTimeout(() => setPdfSuccessMsg(null), 3500);
  };

  // Action: Save or Update Current Student (SỬA)
  const handleSaveCurrentStudent = () => {
    if (studentList.length === 0) {
      pushUndoSnapshot("Tạo học sinh mới");
      const newSt: LoadedStudent = {
        sbd: sbd.trim() || "80101",
        name: studentName.trim() || "Học Sinh Mới",
        className: className.trim() || "8A1",
        examCode: examCode.trim() || "101",
      };
      setStudentList([newSt]);
      setSelectedStudentIdx(0);
      try {
        localStorage.setItem("edumark_active_sheet_students", JSON.stringify([newSt]));
      } catch (e) {}

      if (onSaveClass) {
        const targetClassName = newSt.className;
        onSaveClass({
          id: `CLS-${targetClassName}-${Date.now().toString(36)}`,
          className: targetClassName,
          grade: "Khối 8",
          academicYear: "2025-2026",
          studentCount: 1,
          students: [{ sbd: newSt.sbd, name: newSt.name, gradeClass: targetClassName, gender: "Nam" }],
        });
      }

      setPdfSuccessMsg(`Đã tạo & lưu học sinh "${newSt.name}" vào CSDL!`);
      setTimeout(() => setPdfSuccessMsg(null), 3000);
      return;
    }

    const targetStudentName = studentList[selectedStudentIdx]?.name || studentName;
    pushUndoSnapshot(`Sửa thông tin học sinh "${targetStudentName}"`);

    const updatedList = [...studentList];
    updatedList[selectedStudentIdx] = {
      sbd: sbd.trim(),
      name: studentName.trim(),
      className: className.trim(),
      examCode: examCode.trim(),
    };

    setStudentList(updatedList);

    try {
      localStorage.setItem("edumark_active_sheet_students", JSON.stringify(updatedList));
    } catch (e) {}

    if (onSaveClass) {
      const targetClassName = className.trim() || "8A1";
      const existingClass = classes.find((c) => c.className === targetClassName || c.id === targetClassName);
      onSaveClass({
        id: existingClass?.id || `CLS-${targetClassName}-${Date.now().toString(36)}`,
        className: targetClassName,
        grade: existingClass?.grade || "Khối 8",
        academicYear: existingClass?.academicYear || "2025-2026",
        studentCount: updatedList.length,
        students: updatedList.map((st) => ({
          sbd: st.sbd,
          name: st.name,
          gradeClass: st.className || targetClassName,
          gender: "Nam",
        })),
      });
    }

    setPdfSuccessMsg(`Đã LƯU & CẬP NHẬT thông tin học sinh "${studentName}" thành công!`);
    setTimeout(() => setPdfSuccessMsg(null), 3000);
  };

  // Action: Delete Current Student (XÓA HS)
  const handleDeleteCurrentStudent = () => {
    if (studentList.length === 0 || selectedStudentIdx < 0) return;
    const currentSt = studentList[selectedStudentIdx];
    if (!currentSt) return;

    if (!confirm(`Bạn có chắc chắn muốn XÓA học sinh "${currentSt.name}" (SBD: ${currentSt.sbd}) khỏi danh sách?`)) {
      return;
    }

    pushUndoSnapshot(`Xóa học sinh "${currentSt.name}"`);

    const updatedList = studentList.filter((_, i) => i !== selectedStudentIdx);
    const nextIdx = Math.max(0, Math.min(selectedStudentIdx, updatedList.length - 1));

    setStudentList(updatedList);
    setSelectedStudentIdx(nextIdx);

    if (updatedList.length > 0) {
      applyStudentData(updatedList[nextIdx]);
    } else {
      setStudentName("");
      setSbd("");
    }

    try {
      localStorage.setItem("edumark_active_sheet_students", JSON.stringify(updatedList));
    } catch (e) {}

    setPdfSuccessMsg(`Đã XÓA học sinh "${currentSt.name}". Bấm "Hoàn tác" để khôi phục.`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  // Action: Add New Student (THÊM HS)
  const handleAddNewStudent = () => {
    pushUndoSnapshot("Thêm học sinh mới");

    const newSbd = `${80100 + studentList.length + 1}`;
    const newName = `Học Sinh ${studentList.length + 1}`;
    const availableCodes = Object.keys(currentExam.examKeys || {});
    const defaultCode = availableCodes.length
      ? availableCodes[studentList.length % availableCodes.length]
      : "101";

    const newStudent: LoadedStudent = {
      sbd: newSbd,
      name: newName,
      className: className || "8A1",
      examCode: defaultCode,
    };

    const updatedList = [...studentList, newStudent];
    const newIdx = updatedList.length - 1;

    setStudentList(updatedList);
    setSelectedStudentIdx(newIdx);
    applyStudentData(newStudent);

    try {
      localStorage.setItem("edumark_active_sheet_students", JSON.stringify(updatedList));
    } catch (e) {}

    setPdfSuccessMsg(`Đã THÊM học sinh "${newName}". Vui lòng chỉnh sửa tên & SBD ở các ô bên dưới.`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  // Action: Clear Entire Student List (XÓA DS)
  const handleClearStudentList = () => {
    if (studentList.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn XÓA TOÀN BỘ ${studentList.length} học sinh trong danh sách?`)) {
      return;
    }

    pushUndoSnapshot(`Xóa toàn bộ ${studentList.length} học sinh`);

    setStudentList([]);
    setSelectedStudentIdx(-1);

    try {
      localStorage.removeItem("edumark_active_sheet_students");
    } catch (e) {}

    setPdfSuccessMsg("Đã xóa toàn bộ danh sách. Bấm 'Hoàn tác' để phục hồi lại.");
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  // Selected Class & Class Action Undo Stack
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  interface ClassUndoSnapshot {
    classRoster: ClassRoster;
    actionType: "delete" | "edit";
    description: string;
  }
  const [classUndoStack, setClassUndoStack] = useState<ClassUndoSnapshot[]>([]);

  const handleEditSelectedClass = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (!currentClass) return;

    const newName = prompt("Sửa tên lớp học:", currentClass.className);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Tên lớp không được để trống!");
      return;
    }

    setClassUndoStack((prev) => [
      ...prev,
      {
        classRoster: JSON.parse(JSON.stringify(currentClass)),
        actionType: "edit",
        description: `Sửa tên lớp ${currentClass.className} thành ${trimmed}`,
      },
    ]);

    const updatedClass: ClassRoster = {
      ...currentClass,
      className: trimmed,
      students: currentClass.students.map((st) => ({
        ...st,
        gradeClass: trimmed,
      })),
    };

    if (onSaveClass) {
      onSaveClass(updatedClass);
    }

    setClassName(trimmed);
    setPdfSuccessMsg(`Đã ĐỔI TÊN lớp thành "${trimmed}" & cập nhật CSDL!`);
    setTimeout(() => setPdfSuccessMsg(null), 3500);
  };

  const handleDeleteSelectedClass = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (!currentClass) return;

    if (!confirm(`Bạn có chắc chắn muốn XÓA Lớp ${currentClass.className} (${currentClass.studentCount} học sinh) không?`)) {
      return;
    }

    setClassUndoStack((prev) => [
      ...prev,
      {
        classRoster: JSON.parse(JSON.stringify(currentClass)),
        actionType: "delete",
        description: `Xóa Lớp ${currentClass.className}`,
      },
    ]);

    if (onDeleteClass) {
      onDeleteClass(currentClass.id);
    }

    setSelectedClassId("");
    setPdfSuccessMsg(`Đã XÓA Lớp ${currentClass.className}. Bấm "Hoàn tác Lớp" để khôi phục lại.`);
    setTimeout(() => setPdfSuccessMsg(null), 4500);
  };

  const handleUndoClassAction = () => {
    if (classUndoStack.length === 0) return;
    const lastState = classUndoStack[classUndoStack.length - 1];
    setClassUndoStack((prev) => prev.slice(0, prev.length - 1));

    if (onSaveClass) {
      onSaveClass(lastState.classRoster);
    }

    setSelectedClassId(lastState.classRoster.id);
    setPdfSuccessMsg(`Đã HOÀN TÁC LỚP THÀNH CÔNG: "${lastState.description}"!`);
    setTimeout(() => setPdfSuccessMsg(null), 3500);
  };

  const sheetRef = useRef<HTMLDivElement>(null);

  // Load active saved student list from localStorage if state is empty on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("edumark_active_sheet_students");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudentList(parsed);
          setSelectedStudentIdx(0);
          applyStudentData(parsed[0]);
        }
      }
    } catch (e) {
      console.warn("Could not load active student list:", e);
    }
  }, []);

  // Sync available exam codes when current exam changes
  useEffect(() => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length > 0 && !codes.includes(examCode)) {
      setExamCode(codes[0]);
    }
  }, [currentExam]);

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

  // Load students when a class is selected from existing classes
  const handleSelectClassRoster = (classId: string) => {
    const foundClass = classes.find((c) => c.id === classId);
    if (!foundClass || !foundClass.students.length) return;

    if (studentList.length > 0) {
      pushUndoSnapshot(`Đổi sang lớp ${foundClass.className}`);
    }

    const availableCodes = Object.keys(currentExam.examKeys || {});
    const mapped: LoadedStudent[] = foundClass.students.map((st, idx) => {
      const code = availableCodes.length
        ? availableCodes[idx % availableCodes.length]
        : "101";
      return {
        sbd: st.sbd,
        name: st.name,
        className: st.gradeClass || foundClass.className,
        examCode: code,
      };
    });

    setStudentList(mapped);
    setSelectedStudentIdx(0);
    applyStudentData(mapped[0]);

    try {
      localStorage.setItem("edumark_active_sheet_students", JSON.stringify(mapped));
    } catch (e) {}

    setPdfSuccessMsg(`Đã tải ${mapped.length} học sinh từ lớp ${foundClass.className}`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  const applyStudentData = (st: LoadedStudent) => {
    setStudentName(st.name);
    setClassName(st.className);
    setSbd(st.sbd);
    if (st.examCode) setExamCode(st.examCode);
  };

  const handleSelectStudentIdx = (idx: number) => {
    if (idx < 0 || idx >= studentList.length) return;
    setSelectedStudentIdx(idx);
    applyStudentData(studentList[idx]);
  };

  // Download Sample Excel (.xlsx) Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      { STT: 1, "Số Báo Danh (SBD)": "80101", "Họ và Tên Học Sinh": "Nguyễn Văn An", "Lớp": "8A1", "Mã Đề": "101" },
      { STT: 2, "Số Báo Danh (SBD)": "80102", "Họ và Tên Học Sinh": "Nghiêm Cao Bảo Lâm", "Lớp": "8A1", "Mã Đề": "102" },
      { STT: 3, "Số Báo Danh (SBD)": "80103", "Họ và Tên Học Sinh": "Trần Thị Mai", "Lớp": "8A1", "Mã Đề": "103" },
      { STT: 4, "Số Báo Danh (SBD)": "80104", "Họ và Tên Học Sinh": "Lê Hoàng Nam", "Lớp": "8A1", "Mã Đề": "104" },
      { STT: 5, "Số Báo Danh (SBD)": "80105", "Họ và Tên Học Sinh": "Phạm Vũ Quốc", "Lớp": "8A1", "Mã Đề": "101" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set auto column widths for Excel
    worksheet["!cols"] = [
      { wch: 6 },  // STT
      { wch: 20 }, // SBD
      { wch: 26 }, // Họ và Tên
      { wch: 10 }, // Lớp
      { wch: 10 }, // Mã Đề
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");

    XLSX.writeFile(workbook, "Mau_Danh_Sach_Hoc_Sinh_EduMark.xlsx");
  };

  // Upload Excel / CSV Student List
  const handleFileUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        if (!rawRows || rawRows.length === 0) {
          alert("File Excel/CSV không có dữ liệu!");
          return;
        }

        const availableCodes = Object.keys(currentExam.examKeys || {});
        const parsedStudents: LoadedStudent[] = [];

        let startRowIdx = 0;
        let colIndex = {
          sbd: -1,
          name: -1,
          className: -1,
          examCode: -1,
        };

        // Scan first 5 rows to identify header row
        for (let r = 0; r < Math.min(5, rawRows.length); r++) {
          const rowStr = rawRows[r]
            .map((cell) => String(cell).toLowerCase().trim())
            .join(" ");

          if (
            rowStr.includes("họ") ||
            rowStr.includes("tên") ||
            rowStr.includes("sbd") ||
            rowStr.includes("lớp") ||
            rowStr.includes("ho ten")
          ) {
            startRowIdx = r + 1;
            rawRows[r].forEach((cellVal, cIdx) => {
              const str = String(cellVal).toLowerCase().trim();
              if (
                str.includes("sbd") ||
                str.includes("báo danh") ||
                str.includes("mã hs") ||
                str.includes("mã sv")
              ) {
                colIndex.sbd = cIdx;
              } else if (
                str.includes("họ") ||
                str.includes("tên") ||
                str.includes("name") ||
                str.includes("sinh viên") ||
                str.includes("học sinh")
              ) {
                colIndex.name = cIdx;
              } else if (str.includes("lớp") || str.includes("class")) {
                colIndex.className = cIdx;
              } else if (str.includes("mã đề") || str.includes("đề")) {
                colIndex.examCode = cIdx;
              }
            });
            break;
          }
        }

        // Loop over data rows
        for (let r = startRowIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          let stSbd = "";
          let stName = "";
          let stClass = className || "8A1";
          let stCode = "";

          if (colIndex.name !== -1) {
            stName = String(row[colIndex.name] || "").trim();
            stSbd = colIndex.sbd !== -1 ? String(row[colIndex.sbd] || "").trim() : "";
            stClass =
              colIndex.className !== -1
                ? String(row[colIndex.className] || "").trim() || className
                : className;
            stCode =
              colIndex.examCode !== -1 ? String(row[colIndex.examCode] || "").trim() : "";
          } else {
            const cleanCells = row
              .map((cell) => String(cell).trim())
              .filter((c) => c.length > 0);

            if (cleanCells.length >= 2) {
              if (cleanCells.length >= 4 && !isNaN(Number(cleanCells[0]))) {
                // STT, SBD, Name, Class, [Code]
                stSbd = cleanCells[1];
                stName = cleanCells[2];
                stClass = cleanCells[3] || className;
                stCode = cleanCells[4] || "";
              } else {
                // SBD, Name, Class, [Code]
                stSbd = cleanCells[0];
                stName = cleanCells[1];
                stClass = cleanCells[2] || className;
                stCode = cleanCells[3] || "";
              }
            }
          }

          if (stName) {
            if (!stCode) {
              stCode = availableCodes.length
                ? availableCodes[parsedStudents.length % availableCodes.length]
                : "101";
            }

            parsedStudents.push({
              sbd: stSbd || `8010${parsedStudents.length + 1}`,
              name: stName,
              className: stClass,
              examCode: stCode,
            });
          }
        }

        if (parsedStudents.length > 0) {
          setStudentList(parsedStudents);
          setSelectedStudentIdx(0);
          applyStudentData(parsedStudents[0]);

          // Persist to local storage for instant session recovery
          try {
            localStorage.setItem("edumark_active_sheet_students", JSON.stringify(parsedStudents));
          } catch (e) {}

          // Automatically group and save class roster to Supabase database
          if (onSaveClass) {
            const targetClassName = parsedStudents[0]?.className || className || "8A1";
            const existingClass = classes.find((c) => c.className === targetClassName || c.id === targetClassName);
            const updatedClassRoster: ClassRoster = {
              id: existingClass?.id || `CLS-${targetClassName}-${Date.now().toString(36)}`,
              className: targetClassName,
              grade: existingClass?.grade || "Khối 8",
              academicYear: existingClass?.academicYear || "2025-2026",
              studentCount: parsedStudents.length,
              students: parsedStudents.map((st) => ({
                sbd: st.sbd,
                name: st.name,
                gradeClass: st.className || targetClassName,
                gender: "Nam",
              })),
            };
            onSaveClass(updatedClassRoster);
          }

          setPdfSuccessMsg(
            `Đã tải & LƯU THÀNH CÔNG ${parsedStudents.length} học sinh vào CSDL cho lớp ${parsedStudents[0]?.className || className}!`
          );
          setTimeout(() => setPdfSuccessMsg(null), 5000);
        } else {
          alert("Không tìm thấy thông tin học sinh trong file Excel. Vui lòng thử file mẫu.");
        }
      } catch (err) {
        console.error("Lỗi đọc file Excel:", err);
        alert("Có lỗi khi mở file Excel. Vui lòng kiểm tra lại định dạng file.");
      }
    };

    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = "";
  };

  // FEATURE: Shuffle / Mix Exam Code for current student
  const handleShuffleExamCode = () => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length === 0) return;
    const otherCodes = codes.filter((c) => c !== examCode);
    const chosenCode =
      otherCodes.length > 0
        ? otherCodes[Math.floor(Math.random() * otherCodes.length)]
        : codes[Math.floor(Math.random() * codes.length)];

    setExamCode(chosenCode);

    // Update loaded student's exam code if in list
    if (selectedStudentIdx >= 0 && studentList[selectedStudentIdx]) {
      const updatedList = [...studentList];
      updatedList[selectedStudentIdx].examCode = chosenCode;
      setStudentList(updatedList);
    }
  };

  // FEATURE: Distribute / Shuffle exam codes across the entire student list
  const handleDistributeExamCodesAcrossList = () => {
    const codes = Object.keys(currentExam.examKeys || {});
    if (codes.length === 0 || studentList.length === 0) {
      handleShuffleExamCode();
      return;
    }

    const updated = studentList.map((st, idx) => {
      const nextCode = codes[idx % codes.length];
      return { ...st, examCode: nextCode };
    });

    setStudentList(updated);
    if (selectedStudentIdx >= 0 && updated[selectedStudentIdx]) {
      setExamCode(updated[selectedStudentIdx].examCode);
    }
    setPdfSuccessMsg(`Đã trộn & chia đều ${codes.length} mã đề (${codes.join(", ")}) cho ${updated.length} học sinh!`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  // FEATURE: Generate a brand new shuffled variant code with random keys
  const handleGenerateNewShuffledCode = () => {
    const existingCodes = Object.keys(currentExam.examKeys || {});
    let newCodeNum = 101;
    if (existingCodes.length > 0) {
      const maxCode = Math.max(...existingCodes.map((c) => Number(c) || 100));
      newCodeNum = maxCode + 1;
    }
    const newCode = String(newCodeNum);

    const choices: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
    const newAnswers: Record<number, "A" | "B" | "C" | "D"> = {};

    for (let q = 1; q <= currentExam.questionCount; q++) {
      newAnswers[q] = choices[Math.floor(Math.random() * choices.length)];
    }

    currentExam.examKeys[newCode] = newAnswers;
    setExamCode(newCode);

    setPdfSuccessMsg(`Đã sinh tự động Mã Đề Trộn Mới: ${newCode}!`);
    setTimeout(() => setPdfSuccessMsg(null), 4000);
  };

  const [downloadReady, setDownloadReady] = useState<{
    url: string;
    fileName: string;
    type: "pdf" | "docx";
  } | null>(null);

  const captureSheetToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      onclone: (clonedDoc) => {
        // 1. Sanitize all <style> elements for oklch, lab, color-mix
        const styles = Array.from(clonedDoc.querySelectorAll("style"));
        styles.forEach((style) => {
          if (style.textContent) {
            style.textContent = style.textContent
              .replace(/oklch\([^)]+\)/g, "rgb(30, 41, 59)")
              .replace(/lab\([^)]+\)/g, "rgb(30, 41, 59)")
              .replace(/color-mix\([^)]+\)/g, "rgb(30, 41, 59)");
          }
        });

        // 2. Sanitize inline styles on all elements
        const allElements = Array.from(clonedDoc.querySelectorAll("[style]"));
        allElements.forEach((el) => {
          const st = el.getAttribute("style");
          if (st && (st.includes("oklch") || st.includes("lab") || st.includes("color-mix"))) {
            el.setAttribute(
              "style",
              st
                .replace(/oklch\([^)]+\)/g, "rgb(30, 41, 59)")
                .replace(/lab\([^)]+\)/g, "rgb(30, 41, 59)")
                .replace(/color-mix\([^)]+\)/g, "rgb(30, 41, 59)")
            );
          }
        });

        // 3. Isolate the target element to body root to avoid scroll offset or overflow wrapping bugs
        const clonedTarget = clonedDoc.getElementById("omr-sheet-printable");
        if (clonedTarget) {
          clonedDoc.body.innerHTML = "";
          clonedDoc.body.appendChild(clonedTarget);
          clonedDoc.body.style.margin = "0";
          clonedDoc.body.style.padding = "0";
          clonedDoc.body.style.backgroundColor = "#ffffff";
          clonedDoc.body.style.overflow = "visible";

          clonedTarget.style.position = "static";
          clonedTarget.style.width = "794px";
          clonedTarget.style.minHeight = "1123px";
          clonedTarget.style.transform = "none";
          clonedTarget.style.boxShadow = "none";
          clonedTarget.style.margin = "0 auto";
          clonedTarget.style.backgroundColor = "#ffffff";
        }
      },
    });
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccessMsg(null);

    try {
      const element = sheetRef.current;
      const canvas = await captureSheetToCanvas(element);

      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));

      const fileName = `Phieu_OMR_${currentExam.subject || "BaiThi"}_SBD_${sbd || "80101"}_De_${examCode}.pdf`
        .replace(/\s+/g, "_");

      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Programmatic download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 1000);

      setDownloadReady({
        url: blobUrl,
        fileName,
        type: "pdf",
      });

      setPdfSuccessMsg(`Đã tạo file PDF A4 thành công: ${fileName}`);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      alert("Không thể tạo file PDF tự động. Bạn có thể bấm 'In Ngay' và chọn 'Lưu dưới dạng PDF' của trình duyệt.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!sheetRef.current) return;
    setIsExportingDocx(true);
    setPdfSuccessMsg(null);

    try {
      const element = sheetRef.current;
      const canvas = await captureSheetToCanvas(element);

      const base64Data = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 567, // ~1cm
                  right: 567,
                  bottom: 567,
                  left: 567,
                },
              },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: bytes,
                    type: "png",
                    transformation: {
                      width: 595,
                      height: Math.round((canvas.height * 595) / canvas.width),
                    },
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Phieu_OMR_${currentExam.subject || "BaiThi"}_SBD_${sbd || "80101"}_De_${examCode}.docx`
        .replace(/\s+/g, "_");

      const blobUrl = URL.createObjectURL(blob);

      // Programmatic download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 1000);

      setDownloadReady({
        url: blobUrl,
        fileName,
        type: "docx",
      });

      setPdfSuccessMsg(`Đã tạo file Word (.docx) A4 thành công: ${fileName}`);
    } catch (err: any) {
      console.error("DOCX generation error:", err);
      alert("Không thể tạo file Word. Vui lòng thử lại hoặc sử dụng nút Xuất PDF.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            <span>Tạo & In Phiếu Trả Lời Trắc Nghiệm OMR</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phiếu chuẩn 4 điểm neo góc định vị OMR & Mã QR Code định danh số báo danh tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
               Quay Lại
            </button>
          )}

          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
            title="Xuất file phiếu trả lời trắc nghiệm chuẩn Word (.docx)"
          >
            {isExportingDocx ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{isExportingDocx ? "Đang Xuất Word..." : "Xuất Word (.docx)"}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
            title="Xuất file PDF trang A4 chuẩn in ấn"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Ngay (Print)</span>
          </button>
        </div>
      </div>

      {downloadReady && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-emerald-950">
                Đã tạo thành công file {downloadReady.type === "pdf" ? "PDF A4" : "Word (.docx)"}!
              </p>
              <p className="text-emerald-700 font-medium font-mono text-[11px] mt-0.5">
                {downloadReady.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadReady.url}
              download={downloadReady.fileName}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Bấm Vào Đây Để Tải File Về
            </a>
            <button
              onClick={() => {
                if (downloadReady?.url) URL.revokeObjectURL(downloadReady.url);
                setDownloadReady(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {pdfSuccessMsg && !downloadReady && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters & Controls */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Thiết Lập Thông Tin Phiếu
          </h3>

          {/* 1. Select Exam */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn Bài Thi
            </label>
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

          {/* 2. Upload / Download Student List Template section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Danh Sách Học Sinh (Excel / CSV)
              </span>

              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Tải biểu mẫu Excel (.xlsx) chuẩn"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                Tải Mẫu Excel (.xlsx)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUploadExcel}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                Up File Danh Sách Học Sinh (.xlsx, .csv)
              </button>
            </div>

            {/* If class rosters exist, allow quick choice */}
            {classes.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium my-0.5">
                  <span>Hoặc chọn từ Lớp học đã tạo:</span>
                  {classUndoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndoClassAction}
                      className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all"
                      title={`Hoàn tác lớp: ${classUndoStack[classUndoStack.length - 1].description}`}
                    >
                      <RotateCcw className="w-3 h-3 text-amber-700" />
                      <span>Hoàn tác Lớp ({classUndoStack.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedClassId(cid);
                      if (cid) handleSelectClassRoster(cid);
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 min-w-0"
                  >
                    <option value="" disabled>
                      -- Chọn Lớp Học Roster --
                    </option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Lớp {cls.className} ({cls.studentCount} học sinh)
                      </option>
                    ))}
                  </select>

                  {/* Sửa Lớp Button */}
                  {selectedClassId && (
                    <button
                      type="button"
                      onClick={handleEditSelectedClass}
                      className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      title="Sửa tên Lớp & Thông tin"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-[11px]">Sửa</span>
                    </button>
                  )}

                  {/* Xóa Lớp Button */}
                  {selectedClassId && onDeleteClass && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedClass}
                      className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      title="Xóa Lớp Học này"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-[11px]">Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Student Navigator if loaded */}
            {studentList.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1 text-slate-800 font-extrabold">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Đã tải: {studentList.length} HS
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Undo Button */}
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                        undoStack.length > 0
                          ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer shadow-2xs"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                      title={
                        undoStack.length > 0
                          ? `Hoàn tác: ${undoStack[undoStack.length - 1].description}`
                          : "Chưa có hành động để hoàn tác"
                      }
                    >
                      <RotateCcw className="w-3 h-3 text-amber-700" />
                      <span>Hoàn tác {undoStack.length > 0 ? `(${undoStack.length})` : ""}</span>
                    </button>

                    {/* Add Student Button */}
                    <button
                      type="button"
                      onClick={handleAddNewStudent}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer transition-all"
                      title="Thêm 1 học sinh mới vào danh sách"
                    >
                      <UserPlus className="w-3 h-3 text-indigo-600" />
                      <span>+ Thêm HS</span>
                    </button>

                    {/* Clear Entire List Button */}
                    <button
                      type="button"
                      onClick={handleClearStudentList}
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1 cursor-pointer transition-all"
                      title="Xóa toàn bộ danh sách học sinh"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectStudentIdx(selectedStudentIdx - 1)}
                    disabled={selectedStudentIdx <= 0}
                    className="p-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    title="Học sinh trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={selectedStudentIdx}
                    onChange={(e) => handleSelectStudentIdx(Number(e.target.value))}
                    className="flex-1 bg-white border border-slate-300 rounded-md py-1 px-1.5 text-xs font-bold text-slate-800"
                  >
                    {studentList.map((st, i) => (
                      <option key={i} value={i}>
                        {i + 1}. {st.name} - SBD {st.sbd} (Mã đề {st.examCode})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSelectStudentIdx(selectedStudentIdx + 1)}
                    disabled={selectedStudentIdx >= studentList.length - 1}
                    className="p-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                    title="Học sinh tiếp theo"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Single Student Input Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ & Tên Học Sinh
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp Học
              </label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Báo Danh (SBD)
              </label>
              <input
                type="text"
                value={sbd}
                onChange={(e) => setSbd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Đề Thi
              </label>
              <select
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {Object.keys(currentExam.examKeys || {}).map((code) => (
                  <option key={code} value={code}>
                    Mã Đề {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SỬA / XÓA / HOÀN TÁC Action Toolbar */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleSaveCurrentStudent}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Lưu thông tin vừa chỉnh sửa vào danh sách học sinh & CSDL"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>Lưu Sửa Học Sinh</span>
            </button>

            {studentList.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteCurrentStudent}
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Xóa học sinh này khỏi danh sách"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Xóa HS</span>
              </button>
            )}

            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title={`Hoàn tác: ${undoStack[undoStack.length - 1].description}`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Hoàn Tác</span>
              </button>
            )}
          </div>

          {/* 4. FEATURE: TRỘN MÃ ĐỀ (Exam Code Shuffling) */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-amber-600" />
                Tính Năng Trộn Mã Đề
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                {Object.keys(currentExam.examKeys || {}).length} biến thể đề
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShuffleExamCode}
                className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                title="Đổi ngẫu nhiên mã đề cho học sinh hiện tại"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Trộn Mã Đề
              </button>

              <button
                type="button"
                onClick={handleGenerateNewShuffledCode}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Tạo thêm 1 biến thể mã đề mới kèm đáp án xáo trộn"
              >
                <Plus className="w-3.5 h-3.5" />
                Sinh Mã Đề Mới
              </button>
            </div>

            {studentList.length > 0 && (
              <button
                type="button"
                onClick={handleDistributeExamCodesAcrossList}
                className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Trộn & Gán Mã Đề Tất Cả {studentList.length} Học Sinh
              </button>
            )}
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
                    <div className="flex items-center gap-1.5" translate="no">
                      {(["A", "B", "C", "D"] as const).map((choice) => (
                        <div
                          key={choice}
                          translate="no"
                          className="notranslate w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[9px] bg-white text-black"
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


