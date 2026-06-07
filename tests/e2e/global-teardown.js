const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PID_FILE = path.join(ROOT_DIR, ".playwright-server.pid");

module.exports = async () => {
  if (!fs.existsSync(PID_FILE)) return;

  const pid = Number.parseInt(fs.readFileSync(PID_FILE, "utf8"), 10);
  fs.rmSync(PID_FILE, { force: true });

  if (!Number.isInteger(pid) || pid <= 0) return;

  try {
    process.kill(pid);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
};
