import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: "ok",
    platform: "Vercel Serverless & Supabase DB",
    supabaseUrlConfigured: !!process.env.VITE_SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
}
