const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PID_FILE = path.join(ROOT_DIR, ".playwright-server.pid");
const PORT = process.env.PLAYWRIGHT_PORT || "3100";
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`;

async function waitForHealth(child) {
  const deadline = Date.now() + 120_000;
  let lastError = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Test server exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(HEALTH_URL);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timed out waiting for ${HEALTH_URL}: ${lastError?.message || "no response"}`);
}

module.exports = async () => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT,
      DISABLE_AUTH_RATE_LIMIT: "1"
    },
    stdio: "ignore",
    windowsHide: true
  });

  fs.writeFileSync(PID_FILE, String(child.pid));
  await waitForHealth(child);
};
