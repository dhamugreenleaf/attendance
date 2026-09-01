import express from "express";
import {
    createLeave,
    getMyLeaves,
    getPendingLeaves,
    updateLeaveStatus,
} from "./leave.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All leave routes require authentication
router.use(authenticate);

// Employee routes
router.post("/", createLeave);
router.get("/my-requests", getMyLeaves);

// Approver routes (Cancel route uses same controller, handled internally)
router.get("/pending", authorize("ADMIN", "HR", "MANAGER", "TL"), getPendingLeaves);
router.put("/:id/status", updateLeaveStatus);

export default router;
