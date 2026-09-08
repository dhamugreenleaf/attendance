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

const bulkMark = async (date, records) => {
    const upsertData = records.map(record => ({
        employeeId: record.employeeId,
        date: date,
        status: record.status,
        punchInTime: ["PRESENT", "LATE"].includes(record.status) ? new Date() : null
    }));

    return await attendanceRepo.bulkUpsert(upsertData);
};

const getTeamAttendance = async (teamId, date) => {
    return await attendanceRepo.findByTeamAndDate(teamId, date);
};

const getEmployeeAttendanceSummary = async (employeeId, year, month) => {
    // We can fetch all records for the employee and filter, or add a specific repo method
    // Since findByEmployeeId already returns all, we can filter in memory for now,
    // or better yet, add a query for the specific month. Let's just use the repo's findByEmployeeId and filter.
    const allAttendance = await attendanceRepo.findByEmployeeId(employeeId);
    
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    allAttendance.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month) {
            if (record.status === 'PRESENT') presentCount++;
            else if (record.status === 'ABSENT') absentCount++;
            else if (record.status === 'LATE') lateCount++;
        }
    });

    return {
        year,
        month,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        totalDays: presentCount + absentCount + lateCount // This is total marked days
    };
};

const markOvertime = async (employeeId, date, otStartTime, otEndTime) => {
    let attendance = await attendanceRepo.findByEmployeeAndDate(employeeId, date);
    if (!attendance) {
        // If no attendance was marked for the day, create a new one with OVERTIME status
        return await attendanceRepo.create({
            employeeId,
            date,
            status: "OVERTIME",
            otStartTime,
            otEndTime
        });
    } else {
        // Update the existing record with OT info and change status to OVERTIME
        return await attendanceRepo.update(attendance, {
            status: "OVERTIME",
            otStartTime,
            otEndTime
        });
    }
};

const markPermission = async (employeeId, date, permissionStartTime, permissionEndTime) => {
    let attendance = await attendanceRepo.findByEmployeeAndDate(employeeId, date);
    if (!attendance) {
        return await attendanceRepo.create({
            employeeId,
            date,
            status: "PERMISSION",
            permissionStartTime,
            permissionEndTime
        });
    } else {
        return await attendanceRepo.update(attendance, {
            status: "PERMISSION",
            permissionStartTime,
            permissionEndTime
        });
    }
};

export { punchIn, punchOut, getAllAttendance, getMyAttendance, bulkMark, getTeamAttendance, getEmployeeAttendanceSummary, markOvertime, markPermission };
