import * as attendanceService from "./attendance.service.js";
import { punchInSchema, punchOutSchema, bulkMarkSchema, teamAttendanceQuerySchema } from "./attendance.zod.js";

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

const bulkMark = async (req, res, next) => {
    try {
        const data = bulkMarkSchema.parse(req.body);
        const result = await attendanceService.bulkMark(data.date, data.records);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getTeamAttendance = async (req, res, next) => {
    try {
        const teamId = parseInt(req.params.teamId, 10);
        const { date } = teamAttendanceQuerySchema.parse(req.query);
        const queryDate = date || new Date().toISOString().split('T')[0];
        
        const result = await attendanceService.getTeamAttendance(teamId, queryDate);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getEmployeeAttendanceSummary = async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.employeeId, 10);
        const { year, month } = req.query; // optional, defaults to current month
        const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

        const result = await attendanceService.getEmployeeAttendanceSummary(employeeId, targetYear, targetMonth);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export { punchIn, punchOut, getAllAttendance, getMyAttendance, bulkMark, getTeamAttendance, getEmployeeAttendanceSummary };
