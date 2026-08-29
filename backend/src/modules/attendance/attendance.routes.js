import express from "express";
import {
    punchIn,
    punchOut,
    getAllAttendance,
    getMyAttendance,
} from "./attendance.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Employee can punch in, punch out and view their own attendance
router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/my-records", getMyAttendance);

// HR/Admins can view all records
router.get("/", authorize("ADMIN", "HR"), getAllAttendance);

export default router;
