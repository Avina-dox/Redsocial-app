// services/posts.ts
import api from "../lib/api";

export type Post = {
  id: number;
  user_id: number;
  user?: { id: number; name: string };
  body: string;
  images?: string[];           // URLs absolutas ya normalizadas
  likes_count: number;
  comments_count: number;
  liked: boolean;
  created_at: string;
};

export type Comment = {
  id: number;
  post_id: number;
  user?: { id: number; name: string };
  body: string;
  created_at: string;
};

export async function listPosts(): Promise<Post[]> {
  const { data } = await api.get("/posts");

  // Acepta varias formas de respuesta: [], {data: []}, {posts: []}
  const rawItems: any[] =
    Array.isArray(data) ? data :
    Array.isArray((data as any)?.data) ? (data as any).data :
    Array.isArray((data as any)?.posts) ? (data as any).posts :
    [];

  // Base para convertir rutas relativas a absolutas (quita /api/v1)
  const apiBase = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/api\/v1$/, "");

  const toAbs = (u: string) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u; // ya absoluta
    return `${apiBase}/${u}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const normalizeImageUrl = (img: any): string | null => {
    if (typeof img === "string") return toAbs(img);
    if (img && typeof img === "object") {
      const candidate =
        img.url ??
        img.path ??
        img.src ??
        img.image_url ??
        img.original_url ??
        img.full_url ??
        img.location ??
        null;
      return candidate ? toAbs(String(candidate)) : null;
    }
    return null;
  };

  const items: Post[] = rawItems.map((p: any) => {
    // ==== NOMBRE DEL AUTOR (ROBUSTO) ====
    // Intentamos múltiples campos comunes:
    const authorName =
      p?.user?.name ??
      p?.author?.name ??
      p?.author_name ??
      p?.user_name ??
      p?.username ??
      p?.name ??
      null;

    // Construimos SIEMPRE un objeto `user` si es posible
    const userObj =
      p?.user && typeof p.user === "object"
        ? { id: Number(p.user.id ?? p.user_id ?? p.author_id ?? 0), name: String(p.user.name ?? authorName ?? "Usuario") }
        : p?.author && typeof p.author === "object"
        ? { id: Number(p.author.id ?? p.author_id ?? p.user_id ?? 0), name: String(p.author.name ?? authorName ?? "Usuario") }
        : authorName
        ? { id: Number(p.user_id ?? p.author_id ?? 0), name: String(authorName) }
        : { id: Number(p.user_id ?? 0), name: "Usuario" };

    // Imágenes (acepta images o images_url)
    const rawImgs = Array.isArray(p.images)
      ? p.images
      : Array.isArray(p.images_url)
      ? p.images_url
      : [];

    const images = rawImgs
      .map(normalizeImageUrl)
      .filter((u): u is string => !!u);

    return {
      id: Number(p.id),
      user_id: Number(p.user_id ?? userObj.id ?? 0),
      user: userObj,                              // 👈 SIEMPRE trae .name
      body: String(p.body ?? ""),
      images,
      likes_count: Number(p.likes_count ?? 0),
      comments_count: Number(p.comments_count ?? 0),
      liked: Boolean(p.liked),
      created_at: p.created_at ?? new Date().toISOString(),
    };
  });

  return items;
}

export async function createPost(body: string, imageUris: string[] = []) {
  const form = new FormData();
  form.append("body", body);
  imageUris.forEach((uri, idx) => {
    const name = uri.split("/").pop() || `photo_${idx}.jpg`;
    form.append("images[]", { uri, name, type: "image/jpeg" } as any);
  });

  const { data } = await api.post("/posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function toggleLike(postId: number, liked: boolean) {
  if (liked) {
    await api.delete(`/posts/${postId}/like`);
  } else {
    await api.post(`/posts/${postId}/like`);
  }
}

export async function listComments(postId: number): Promise<Comment[]> {
  const { data } = await api.get(`/posts/${postId}/comments`);
  const arr = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
  // Aseguramos user.name también en comentarios (por si acaso)
  return arr.map((c: any) => ({
    id: Number(c.id),
    post_id: Number(c.post_id ?? postId),
    user: c.user
      ? { id: Number(c.user.id ?? 0), name: String(c.user.name ?? "Usuario") }
      : { id: 0, name: "Usuario" },
    body: String(c.body ?? ""),
    created_at: c.created_at ?? new Date().toISOString(),
  })) as Comment[];
}

export async function addComment(postId: number, body: string) {
  const { data } = await api.post(`/posts/${postId}/comments`, { body });
  return data;
}
