-- ========================================================
-- SCRIPT TẠO BẢNG CƠ SỞ DỮ LIỆU EDUMARK AI TRÊN SUPABASE
-- Project URL: https://pptigljquogmpizgaogd.supabase.co
-- ========================================================

-- 1. Bảng Đề thi (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 40,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  exam_keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
);

-- 2. Bảng Bài đã chấm (Graded Sheets)
CREATE TABLE IF NOT EXISTS public.graded_sheets (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
  exam_title TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  score NUMERIC(4,2) NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  scanned_at TEXT NOT NULL,
  image_thumbnail TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  anomalies JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'verified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Lớp học & Danh sách học sinh (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  students JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Nhật ký hệ thống (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  "user" TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graded_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow Public / Anon access for read and write (EduMark Applet)
CREATE POLICY "Allow public read write on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on graded_sheets" ON public.graded_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime subscriptions on all EduMark tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.graded_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
