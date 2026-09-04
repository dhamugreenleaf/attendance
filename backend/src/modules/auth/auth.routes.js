import express from "express";
import { login, getMe, signup, verifyOtp, changePassword } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", authenticate, changePassword);
router.get("/me", authenticate, getMe);

export default router;
