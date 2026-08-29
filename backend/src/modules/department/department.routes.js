import express from "express";
import {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
} from "./department.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Only ADMIN and HR can manage departments
router.use(authenticate);

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

router.post("/", authorize("ADMIN", "HR"), createDepartment);
router.put("/:id", authorize("ADMIN", "HR"), updateDepartment);
router.delete("/:id", authorize("ADMIN", "HR"), deleteDepartment);

export default router;
