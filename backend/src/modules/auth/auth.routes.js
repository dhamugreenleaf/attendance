import express from "express";
import { login, getMe, signup, verifyOtp, changePassword, forceChangePassword, updateProfile } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", authenticate, changePassword);
router.post("/force-change-password", authenticate, forceChangePassword);
router.put("/update-profile", authenticate, updateProfile);
router.get("/me", authenticate, getMe);

export default router;
