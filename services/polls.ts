// /app/services/polls.ts
import api from "../lib/api";

export type PollOption = {
  id: number;
  text: string;
  votes_count: number;
};
export type Poll = {
  id: number;
  title: string;
  description?: string | null;
  closes_at?: string | null;
  is_closed: boolean;
  options: PollOption[];
  user_vote_option_id?: number | null;
};

function normalizeOption(o: any): PollOption {
  return {
    id: Number(o?.id ?? 0),
    text: String(o?.text ?? o?.title ?? o?.label ?? "Opción"),
    votes_count: Number(o?.votes_count ?? o?.votes ?? o?.count ?? 0),
  };
}

function normalizePoll(p: any): Poll {
  const closesAt = p?.closes_at ?? p?.close_at ?? p?.closesAt ?? null;
  let isClosed = Boolean(p?.is_closed ?? p?.closed ?? p?.isClosed ?? false);
  if (!isClosed && closesAt) {
    const t = Date.parse(String(closesAt));
    if (!Number.isNaN(t)) isClosed = Date.now() > t;
  }
  const opts = Array.isArray(p?.options) ? p.options.map(normalizeOption) : [];
  const userVote =
    p?.user_vote_option_id ??
    p?.user_vote?.option_id ??
    p?.voted_option_id ??
    null;

  return {
    id: Number(p?.id ?? 0),
    title: String(p?.title ?? p?.question ?? "Encuesta"),
    description: p?.description ?? null,
    closes_at: closesAt ? String(closesAt) : null,
    is_closed: isClosed,
    user_vote_option_id: userVote != null ? Number(userVote) : null,
    options: opts,
  };
}

// 👇 ESTE es el que te faltaba bien armado
export async function listPolls(params?: {
  q?: string;
  status?: "open" | "closed";
  page?: number;
  per_page?: number;
}) {
  const { data } = await api.get("/polls", { params });

  // Laravel paginator => { data: [], links: {...}, meta: {...} }
  const rowsRaw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const rows = rowsRaw.map(normalizePoll);

  const meta = data?.meta ?? null; // current_page, last_page, per_page, total, etc.

  return { rows, meta };
}

export async function getPoll(id: number): Promise<Poll> {
  const { data } = await api.get(`/polls/${id}`);
  const raw = (data && typeof data === "object" && "data" in data) ? (data as any).data : data;
  return normalizePoll(raw);
}

export async function votePoll(pollId: number, optionId: number): Promise<void> {
  await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
}

export async function createPoll(params: {
  question: string;
  options: string[];
  closesAt?: Date | null;
  requireClose?: boolean;
  description?: string | null;
}) {
  const title = params.question?.trim();
  const options = params.options.map(o => o.trim()).filter(Boolean);
  if (!title) throw new Error("La pregunta (título) es obligatoria.");
  if (options.length < 2) throw new Error("Agrega al menos 2 opciones.");

  const payload = {
    title,
    description: (params.description ?? "").trim() || null,
    closes_at: params.closesAt ? params.closesAt.toISOString() : null,
    options: options.map(text => ({ text })),
  };

  const { data } = await api.post("/polls", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}
