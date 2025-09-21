import { Router } from "express";
import { body } from "express-validator";
import AuthController from "../controllers/AuthController";
import TokenService from "../services/TokenService";
import { authMiddleware } from "../middleware/authMiddleware";

export default (authController: AuthController, tokenService: TokenService) => {
  const router = Router();

  router.post(
    "/register",
    body("name").isLength({ min: 1 }),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    authController.register
  );

  router.post("/login", authController.login);
  router.get("/whoami", authMiddleware(tokenService), authController.whoami);

  return router;
};
