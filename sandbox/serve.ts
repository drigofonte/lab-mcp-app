import express from "express";
import { readFileSync } from "fs";
import { join } from "path";

const PORT = 8082;
const FRONTEND_ORIGIN = "http://localhost:5173";

const app = express();

const sandboxHtml = readFileSync(join(__dirname, "sandbox.html"), "utf-8");

app.get("/sandbox.html", (req, res) => {
  // CORS headers for frontend origin
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Apply CSP from query parameter if provided
  const csp = req.query.csp;
  if (typeof csp === "string" && csp.length > 0) {
    res.setHeader("Content-Security-Policy", csp);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(sandboxHtml);
});

// Handle CORS preflight
app.options("/sandbox.html", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Sandbox proxy server listening on http://localhost:${PORT}`);
});
