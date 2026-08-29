import * as attendanceRepo from "./attendance.repository.js";
import * as employeeRepo from "../employee/employee.repository.js";

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

const punchIn = async (employeeId) => {
    const employee = await employeeRepo.findById(employeeId);
    if (!employee) {
        const err = new Error("Employee profile not found");
        err.statusCode = 404;
        throw err;
    }

    const today = getTodayDateString();

    const existing = await attendanceRepo.findByEmployeeAndDate(employeeId, today);
    if (existing) {
        const err = new Error("Already punched in today");
        err.statusCode = 409;
        throw err;
    }

    return await attendanceRepo.create({
        employeeId,
        date: today,
        punchInTime: new Date(),
        status: "PRESENT",
    });
};

const punchOut = async (employeeId) => {
    const today = getTodayDateString();

    const attendance = await attendanceRepo.findByEmployeeAndDate(employeeId, today);
    if (!attendance) {
        const err = new Error("No punch-in record found for today");
        err.statusCode = 404;
        throw err;
    }

    if (attendance.punchOutTime) {
        const err = new Error("Already punched out today");
        err.statusCode = 409;
        throw err;
    }

    return await attendanceRepo.update(attendance, {
        punchOutTime: new Date(),
    });
};

const getAllAttendance = async () => {
    return await attendanceRepo.findAll();
};

const getMyAttendance = async (userId) => {
    const employee = await employeeRepo.findByUserId(userId);
    if (!employee) {
        const err = new Error("Employee profile not found");
        err.statusCode = 404;
        throw err;
    }

    return await attendanceRepo.findByEmployeeId(employee.id);
};

export { punchIn, punchOut, getAllAttendance, getMyAttendance };
