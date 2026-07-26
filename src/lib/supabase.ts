/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

// Supabase configuration with credentials provided for project pptigljquogmpizgaogd
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://pptigljquogmpizgaogd.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGlnbGpxdW9nbXBpemdhb2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjE0MTMsImV4cCI6MjEwMDYzNzQxM30.aP4C8ALU1iJH6A0kVUQt6MUq0egAHzJPwYpVcTmtnDI";

export const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGlnbGpxdW9nbXBpemdhb2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTA2MTQxMywiZXhwIjoyMTAwNjM3NDEzfQ.2f0jlMZzByxHig82cJ31WylDH76TnQ7_W0vMKzSBOFc";

// Create client for browser/applet usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Utility function to test Supabase connection
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tablesFound?: string[];
  message: string;
}> {
  try {
    const { data, error } = await supabase.from("exams").select("id").limit(1);

    if (error) {
      if (error.code === "42P01") {
        // Table does not exist yet in Supabase schema
        return {
          connected: true,
          tablesFound: [],
          message:
            "Đã kết nối Supabase thành công! Cần chạy script SQL để tạo bảng (Exams, GradedSheets, Classes, AuditLogs).",
        };
      }
      return {
        connected: false,
        message: `Lỗi kết nối Supabase: ${error.message}`,
      };
    }

    return {
      connected: true,
      tablesFound: ["exams"],
      message: "Kết nối Supabase hoàn tất và đã đọc được dữ liệu!",
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Ngoại lệ kết nối: ${err?.message || "Không xác định"}`,
    };
  }
}
