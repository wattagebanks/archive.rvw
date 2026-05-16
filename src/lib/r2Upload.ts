const env = import.meta.env;

/** Dev default when .env is missing — matches Vite proxy in vite.config.ts */
const DEV_UPLOAD_BASE = "/api";

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function getUploadApiBase(): string | null {
  const raw = env.VITE_R2_UPLOAD_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (env.DEV) return DEV_UPLOAD_BASE;
  return null;
}

export function getUploadToken(): string | null {
  const t = env.VITE_R2_UPLOAD_TOKEN?.trim();
  return t || null;
}

export type UploadErrorBody = { error?: string };

export async function uploadGarmentImageToR2(
  file: File,
  pieceId: number,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const base = getUploadApiBase();
  if (!base) {
    throw new Error(
      "Upload URL is not configured. Set VITE_R2_UPLOAD_URL for production builds."
    );
  }

  const url = joinUrl(base, "/upload");
  const token = getUploadToken();

  const form = new FormData();
  form.set("file", file);
  form.set("pieceId", String(pieceId));

  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      headers,
      signal: options?.signal,
    });
  } catch {
    throw new Error(
      import.meta.env.DEV
        ? "Could not reach the upload Worker. Run npm run dev (starts Vite and the R2 upload Worker)."
        : "Could not reach the upload API. Check VITE_R2_UPLOAD_URL."
    );
  }

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg =
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as UploadErrorBody).error === "string"
        ? (parsed as UploadErrorBody).error
        : text || res.statusText;
    throw new Error(msg || `Upload failed (${res.status})`);
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "url" in parsed &&
    typeof (parsed as { url: unknown }).url === "string"
  ) {
    return (parsed as { url: string }).url;
  }

  throw new Error("Upload response missing url");
}
