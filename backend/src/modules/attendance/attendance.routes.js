import express from "express";
import {
    punchIn,
    punchOut,
    getAllAttendance,
    getMyAttendance,
    bulkMark,
    getTeamAttendance,
    getEmployeeAttendanceSummary,
    markOvertime,
    markPermission,
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

// TLs and Admins can view team attendance and bulk mark
router.get("/team/:teamId", authorize("ADMIN", "HR", "TL", "MANAGER"), getTeamAttendance);
router.post("/bulk-mark", authorize("ADMIN", "HR", "TL", "MANAGER"), bulkMark);
router.post("/overtime", authorize("ADMIN", "HR", "TL", "MANAGER"), markOvertime);
router.post("/permission", authorize("ADMIN", "HR", "TL", "MANAGER"), markPermission);

// View employee summary
router.get("/employee/:employeeId/summary", authorize("ADMIN", "HR", "TL", "MANAGER"), getEmployeeAttendanceSummary);

export default router;
