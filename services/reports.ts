// app/services/reports.ts
import api from "../lib/api";

export type Report = {
  id: number;
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  created_at?: string | null;
  expires_at?: string | null;
};

// Tokens que el backend acepta (según tu ReportController@store)
export type TtlToken = "6h" | "24h" | "3d" | "7d";

// Para UI si necesitas mapear de minutos a token o viceversa
export const TTL_TOKENS: { label: string; token: TtlToken }[] = [
  { label: "6 h", token: "6h" },
  { label: "24 h", token: "24h" },
  { label: "3 d", token: "3d" },
  { label: "7 d", token: "7d" },
];

function normalizeReport(r: any): Report {
  return {
    id: Number(r?.id ?? 0),
    title: String(r?.title ?? ""),
    description: r?.description ?? null,
    lat: Number(r?.lat ?? r?.latitude ?? 0),
    lng: Number(r?.lng ?? r?.longitude ?? 0),
    created_at: r?.created_at ?? null,
    expires_at: r?.expires_at ?? null,
  };
}

/** Lista reportes activos (tu API ya filtra con scope active y limita a 500) */
export async function listReports() {
  const { data } = await api.get("/reports");
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  return rows.map(normalizeReport);
}

/** Crea un reporte — IMPORTANTE: ttl va como token string ("6h" | "24h" | "3d" | "7d") */
export async function createReport(input: {
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  ttl: TtlToken;
}) {
  const payload = {
    title: String(input.title ?? "").trim(),
    description: input.description?.trim() || null,
    lat: Number(input.lat),
    lng: Number(input.lng),
    ttl: input.ttl, // 👈 token string que valida el backend
  };

  try {
    const { data } = await api.post("/reports", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeReport(data?.data ?? data);
  } catch (e: any) {
    const res = e?.response;
    const msg = res?.data?.message || e?.message || "No se pudo crear el reporte.";
    const errors = res?.data?.errors;
    if (errors && typeof errors === "object") {
      const details = Object.entries(errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
        .join("\n");
      throw new Error(`${msg}\n${details}`);
    }
    throw new Error(msg);
  }
}
