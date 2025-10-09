// services/reports.ts
import api from "../lib/api";

export type Report = {
  id: number;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  created_at: string;
};

export async function listReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports");
  return data;
}

export async function createReport(payload: {
  title: string;
  description?: string;
  lat: number;
  lng: number;
}) {
  const { data } = await api.post("/reports", payload);
  return data;
}
