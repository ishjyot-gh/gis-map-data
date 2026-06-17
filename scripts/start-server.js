const { spawn } = require("child_process");

const port = "5173";
const host = "localhost";
const url = `http://${host}:${port}/`;

console.log(`Starting GIS map server at ${url}`);
console.log("Press Ctrl+C to stop the server.");

const server = spawn("python", ["-m", "http.server", port, "--bind", host], {
  stdio: "inherit",
  shell: false
});

server.on("error", error => {
  console.error(`Failed to start Python server: ${error.message}`);
  process.exit(1);
});

server.on("exit", code => {
  process.exit(code || 0);
});
