import * as attendanceService from "./attendance.service.js";
import { punchInSchema, punchOutSchema } from "./attendance.zod.js";

const punchIn = async (req, res, next) => {
    try {
        const data = punchInSchema.parse(req.body);
        const result = await attendanceService.punchIn(data.employeeId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const punchOut = async (req, res, next) => {
    try {
        const data = punchOutSchema.parse(req.body);
        const result = await attendanceService.punchOut(data.employeeId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getAllAttendance = async (req, res, next) => {
    try {
        const result = await attendanceService.getAllAttendance();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await attendanceService.getMyAttendance(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export { punchIn, punchOut, getAllAttendance, getMyAttendance };
