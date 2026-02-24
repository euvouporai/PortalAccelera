import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Azure SQL Configuration
  const sqlConfig = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    database: process.env.AZURE_SQL_DATABASE,
    server: process.env.AZURE_SQL_SERVER || "",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true, // for azure
      trustServerCertificate: false // change to true for local dev / self-signed certs
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "BFF is running" });
  });

  // Example route to query Azure SQL
  app.get("/api/data", async (req, res) => {
    try {
      if (!process.env.AZURE_SQL_SERVER) {
        return res.status(500).json({ error: "Azure SQL not configured" });
      }
      const pool = await sql.connect(sqlConfig);
      const result = await pool.request().query("SELECT TOP 10 * FROM Information_Schema.Tables");
      res.json(result.recordset);
    } catch (err) {
      console.error("SQL error", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BFF Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
