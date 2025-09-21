import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db";
import TokenService from "./services/TokenService";
import AuthController from "./controllers/AuthController";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const tokenService = await TokenService.init();
  const authController = new AuthController(tokenService);

  const app = express();
  app.use(express.json());
  app.use(helmet());
  app.use(cors({ origin: "http://localhost:8080", credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  app.use("/api/auth", authRoutes(authController, tokenService));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
