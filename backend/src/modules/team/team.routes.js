import express from "express";
import {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
} from "./team.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router.get("/", getTeams);
router.get("/:id", getTeamById);

router.post("/", authorize("ADMIN", "HR"), createTeam);
router.put("/:id", authorize("ADMIN", "HR"), updateTeam);
router.delete("/:id", authorize("ADMIN", "HR"), deleteTeam);

export default router;
