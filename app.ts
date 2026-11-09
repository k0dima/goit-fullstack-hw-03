import express from "express";
import type { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import helmet from "helmet";

import authRouter from "./src/routes/auth.routes.ts";
import announcementsRouter from "./src/routes/announcements.routes.ts";

import { generateOpenApiDocument } from "./src/openapi.ts";
import { logger } from "./src/logger.ts";

const app = express();


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(pinoHttp({ logger }));

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());
const openApiDocument = generateOpenApiDocument();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/auth", strictLimiter, authRouter);
app.use("/api/announcements", announcementsRouter);

// 404 Not Found handler - must be after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    req.log.warn("Validation failed");

    return res.status(400).json({
      error: "Validation failed",
      details: {
        body: ["Invalid JSON format in request body"],
      },
    });
  }

  if (err.status && err.status >= 400 && err.status < 500) {
    req.log.warn(err.message);

    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === "P2025") {
    req.log.warn("Resource not found");

    return res.status(404).json({ error: "Resource not found" });
  }

  if (err.code === "P2002") {
    req.log.warn("Unique constraint violation");

    return res.status(409).json({ error: "Unique constraint violation" });
  }

  if (err.code === "P2003") {
    req.log.warn("Foreign key constraint failed");

    return res.status(400).json({ error: "Foreign key constraint failed" });
  }

  req.log.error({ err }, "Internal server error");
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(
    `Server is running on port ${PORT}: http://localhost:${PORT}/api-docs`,
  );
});
