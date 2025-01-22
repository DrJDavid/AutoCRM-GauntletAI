import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import authRoutes from './routes/auth';

// Check required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port retry mechanism
  const startServer = async (retries = 3) => {
    const BASE_PORT = 5000;

    for (let i = 0; i < retries; i++) {
      const port = BASE_PORT + i;
      try {
        await new Promise((resolve, reject) => {
          const instance = server.listen(port, "0.0.0.0", () => {
            log(`Server running on port ${port}`);
            resolve(instance);
          });

          instance.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
              log(`Port ${port} is in use, trying next port...`);
              instance.close();
              if (i === retries - 1) {
                reject(new Error(`Could not find an available port after ${retries} attempts`));
              }
            } else {
              reject(error);
            }
          });
        });
        break;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
      }
    }
  };

  try {
    await startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// API routes
app.use('/api/auth', authRoutes);