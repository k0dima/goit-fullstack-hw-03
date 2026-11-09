import { Router } from "express";
import {
  me,
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller.ts";
import { validateBody } from "../middleware/validate.ts";
import { RegisterSchema, LoginSchema } from "../validators/auth.validator.ts";
import authenticate from "../middleware/authenticate.ts";

const router = Router();

router.get("/me", authenticate, me);
router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);

export default router;
