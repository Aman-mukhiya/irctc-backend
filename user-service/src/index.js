// require("dotenv").config();
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import config from "./config/index.js";
import  logger  from "./config/logger.js";

import authRoutes from "./routes/auth.route.js";

import corsMiddleware from "./middlewares/cors.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { reqLogger } from "./middlewares/req.middleware.js";

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(reqLogger);
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello from index.js of user-service");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    const server = app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`,
      );
    });
  } catch (error) {
    logger.error("Failed to Start Server", error);
    process.exit(1);
  }
};
startServer();
