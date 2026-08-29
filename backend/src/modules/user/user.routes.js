// User Routes
import express from "express";

import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    changeUserStatus,
    deleteUser,
} from "./user.controller.js";

const router = express.Router();

// Create User
router.post("/", createUser);

// Get All Users
router.get("/", getUsers);

// Get User By ID
router.get("/:id", getUserById);

// Update User
router.put("/:id", updateUser);

// Change User Status
router.patch("/:id/status", changeUserStatus);

// Delete User
router.delete("/:id", deleteUser);

export default router;
