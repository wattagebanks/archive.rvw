import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Wrangler dev default (workers/r2-upload) */
const UPLOAD_DEV_TARGET = "http://127.0.0.1:8787";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const uploadTarget = env.VITE_UPLOAD_PROXY_TARGET || UPLOAD_DEV_TARGET;

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: uploadTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = req.headers.host;
              if (host) {
                proxyReq.setHeader("X-Forwarded-Host", host);
                proxyReq.setHeader("X-Forwarded-Proto", "http");
                proxyReq.setHeader("X-Forwarded-Prefix", "/api");
              }
            });
          },
        },
      },
    },
  };
});
