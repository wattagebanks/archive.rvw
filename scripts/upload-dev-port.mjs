import net from "node:net";
import { execSync } from "node:child_process";

const PREFERRED = 8787;
const MAX_TRY = 8797;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

/** Stop stale wrangler/workerd dev servers blocking the upload port. */
function releaseStaleUploadPort(port) {
  let pids = [];
  try {
    pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return;
  }

  for (const pid of pids) {
    let name = "";
    try {
      name = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" }).trim();
    } catch {
      continue;
    }
    if (/workerd|wrangler|miniflare|node/i.test(name)) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      } catch {
        /* ignore */
      }
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getUploadDevPort() {
  if (!(await isPortFree(PREFERRED))) {
    releaseStaleUploadPort(PREFERRED);
    await sleep(250);
  }

  for (let port = PREFERRED; port <= MAX_TRY; port++) {
    if (await isPortFree(port)) return port;
  }

  throw new Error(
    `No free port between ${PREFERRED} and ${MAX_TRY} for the upload Worker.`
  );
}
