import express from "express";
import {
    createPermission,
    getMyPermissions,
    getPendingPermissions,
    updatePermissionStatus,
} from "./permission.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Employee routes
router.post("/", createPermission);
router.get("/my-requests", getMyPermissions);

// Approver routes
router.get("/pending", authorize("ADMIN", "HR", "MANAGER", "TL"), getPendingPermissions);
router.put("/:id/status", updatePermissionStatus);

export default router;
