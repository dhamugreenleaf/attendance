import { z } from "zod";

const punchInSchema = z.object({
    employeeId: z.coerce.number().int().positive(),
});

const punchOutSchema = z.object({
    employeeId: z.coerce.number().int().positive(),
});

const attendanceIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bulkMarkSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD"),
    records: z.array(
        z.object({
            employeeId: z.coerce.number().int().positive(),
            status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME", "PERMISSION"]),
        })
    ).min(1, "At least one record is required"),
});

const teamAttendanceQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD").optional(),
});

const overtimeSchema = z.object({
    employeeId: z.coerce.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD"),
    otStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format, should be HH:mm or HH:mm:ss"),
    otEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format, should be HH:mm or HH:mm:ss"),
});

const permissionSchema = z.object({
    employeeId: z.coerce.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD"),
    permissionStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format, should be HH:mm or HH:mm:ss"),
    permissionEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format, should be HH:mm or HH:mm:ss"),
});

export { punchInSchema, punchOutSchema, attendanceIdSchema, bulkMarkSchema, teamAttendanceQuerySchema, overtimeSchema, permissionSchema };
