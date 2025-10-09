// helpers arriba del archivo
function pad(n: number) { return n < 10 ? `0${n}` : String(n); }
export function toLaravelDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---- reemplaza createPoll por esta versión fija ----
export async function createPoll(params: {
  question: string;     // texto que escribes en la UI
  options: string[];    // opciones en texto
  closesAt?: Date | null;
  requireClose?: boolean;
}) {
  const title = params.question?.trim();                     // 👈 mapeamos a 'title'
  const options = params.options.map(o => o.trim()).filter(Boolean);
  const { closesAt, requireClose } = params;

  if (!title) throw new Error("La pregunta (título) es obligatoria.");
  if (options.length < 2) throw new Error("Agrega al menos 2 opciones.");
  if (requireClose && !closesAt) throw new Error("Debes indicar fecha/hora de cierre.");

  const payload: any = {
    title,                 // 👈 lo que Laravel valida como 'title'
    options,               // 👈 array de strings
  };
  if (closesAt) payload.close_at = toLaravelDateTime(closesAt); // 👈 nombre exacto

  try {
    const { data } = await api.post("/polls", payload);
    return data;
  } catch (e: any) {
    // Mostrar mensajes de validación del backend si vienen en detalle
    const res = e?.response;
    const message = res?.data?.message || e?.message || "No se pudo crear la encuesta.";
    const errors = res?.data?.errors;
    if (errors && typeof errors === "object") {
      // concatena los primeros mensajes de cada campo
      const details = Object.entries(errors)
        .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v[0] : v)}`)
        .join("\n");
      throw new Error(`[${res.status}] ${message}\n${details}`);
    }
    throw new Error(`[${res?.status ?? "ERR"}] ${message}`);
  }
}
