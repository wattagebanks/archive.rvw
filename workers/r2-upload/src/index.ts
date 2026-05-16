interface Env {
  ARCHIVE: R2Bucket;
  /** Public origin for objects, e.g. https://your-bucket.r2.dev — no trailing slash. Empty uses this worker’s /media/… */
  PUBLIC_BASE_URL: string;
  /** Optional. If set, require Authorization: Bearer <UPLOAD_SECRET> */
  UPLOAD_SECRET?: string;
}

function withCors(req: Request, res: Response): Response {
  const headers = new Headers(res.headers);
  const allow = req.headers.get("Origin") ?? "*";
  headers.set("Access-Control-Allow-Origin", allow);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(res.body, { status: res.status, headers });
}

function json(req: Request, body: unknown, status = 200): Response {
  return withCors(
    req,
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  );
}

function extFromMime(mime: string, name: string): string {
  const fromName = name.includes(".")
    ? name
        .split(".")
        .pop()!
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    : "";
  if (fromName && fromName.length <= 5) return fromName;
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/avif") return "avif";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}

const MAX_BYTES = 15 * 1024 * 1024;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") {
      return withCors(req, new Response(null, { status: 204 }));
    }

    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      const key = url.pathname.slice("/media/".length);
      if (!key || key.includes("..")) {
        return withCors(req, new Response("Bad request", { status: 400 }));
      }
      const obj = await env.ARCHIVE.get(key);
      if (!obj) {
        return withCors(req, new Response("Not found", { status: 404 }));
      }
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      const allow = req.headers.get("Origin") ?? "*";
      headers.set("Access-Control-Allow-Origin", allow);
      headers.set("Vary", "Origin");
      return new Response(obj.body, { headers });
    }

    if (req.method !== "POST" || url.pathname !== "/upload") {
      return withCors(req, new Response("Not found", { status: 404 }));
    }

    if (env.UPLOAD_SECRET) {
      const auth = req.headers.get("Authorization");
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token !== env.UPLOAD_SECRET) {
        return json(req, { error: "Unauthorized" }, 401);
      }
    }

    const rawCt = req.headers.get("Content-Type") ?? "";
    if (!rawCt.toLowerCase().includes("multipart/form-data")) {
      return json(req, { error: "Expected multipart/form-data" }, 400);
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json(req, { error: "Invalid multipart body" }, 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return json(req, { error: "Missing file field" }, 400);
    }

    const pieceRaw = form.get("pieceId");
    const pieceId =
      typeof pieceRaw === "string" && /^[0-9]+$/.test(pieceRaw)
        ? pieceRaw
        : "misc";

    if (!file.type.startsWith("image/")) {
      return json(req, { error: "File must be an image" }, 400);
    }

    if (file.size > MAX_BYTES) {
      return json(req, { error: "File too large (max 15MB)" }, 413);
    }

    const ext = extFromMime(file.type, file.name);
    const key = `garments/${pieceId}/${crypto.randomUUID()}.${ext}`;

    await env.ARCHIVE.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    const publicUrl = buildPublicObjectUrl(req, url, env, key);

    return json(req, { url: publicUrl, key });
  },
} satisfies ExportedHandler<Env>;

function buildPublicObjectUrl(
  req: Request,
  url: URL,
  env: Env,
  key: string
): string {
  const configured = env.PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  if (configured.length) return `${configured}/${key}`;

  const origin = publicRequestOrigin(req, url);
  const prefix =
    req.headers.get("X-Forwarded-Prefix")?.replace(/\/$/, "") ?? "";
  return `${origin}${prefix}/media/${key}`;
}

function publicRequestOrigin(req: Request, url: URL): string {
  const host = req.headers.get("X-Forwarded-Host");
  if (host) {
    const proto = req.headers.get("X-Forwarded-Proto") ?? "https";
    return `${proto}://${host}`;
  }
  return url.origin;
}
