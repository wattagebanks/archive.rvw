import { spawn } from "node:child_process";
import { getUploadDevPort } from "./upload-dev-port.mjs";

const port = await getUploadDevPort();
console.log(`[dev] Upload Worker → http://127.0.0.1:${port} (Vite proxies /api here)`);

const env = {
  ...process.env,
  VITE_UPLOAD_PROXY_TARGET: `http://127.0.0.1:${port}`,
};

const child = spawn(
  "npx",
  [
    "concurrently",
    "-k",
    "-n",
    "vite,upload",
    "-c",
    "blue,magenta",
    "vite",
    `wrangler dev --config workers/r2-upload/wrangler.jsonc --port ${port} --ip 127.0.0.1`,
  ],
  { env, stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 0));
