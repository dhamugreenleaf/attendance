import express from "express";
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
} from "./employee.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "HR", "MANAGER", "TL"), getEmployees);
router.get("/:id", getEmployeeById); // Users can view profiles

router.post("/", authorize("ADMIN", "HR", "MANAGER", "TL"), createEmployee);
router.put("/:id", authorize("ADMIN", "HR", "TL"), updateEmployee);
router.delete("/:id", authorize("ADMIN", "HR"), deleteEmployee);

export default router;
