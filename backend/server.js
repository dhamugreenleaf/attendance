import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./src/config/db.js";
import { sequelize } from "./src/models/index.js";

import userRoutes from "./src/modules/user/user.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import departmentRoutes from "./src/modules/department/department.routes.js";
import teamRoutes from "./src/modules/team/team.routes.js";
import employeeRoutes from "./src/modules/employee/employee.routes.js";
import attendanceRoutes from "./src/modules/attendance/attendance.routes.js";
import leaveRoutes from "./src/modules/leave/leave.routes.js";
import permissionRoutes from "./src/modules/permission/permission.routes.js";
import notificationRoutes from "./src/modules/notification/notification.routes.js";
import { startCronJobs } from "./src/cron/attendanceReminders.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ===============================
// Middleware
// ===============================

app.use(
    cors({
        origin: "*",
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Health Check
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Office Attendance Backend API is running",
    });
});

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is healthy",
    });
});


// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/notifications", notificationRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ success: false, message });
});

// ===============================
// Start Server
// ===============================

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });

        // Initialize background tasks
        startCronJobs();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();