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
            status: z.enum(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE", "OVERTIME"]),
        })
    ).min(1, "At least one record is required"),
});

const teamAttendanceQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD").optional(),
});

export { punchInSchema, punchOutSchema, attendanceIdSchema, bulkMarkSchema, teamAttendanceQuerySchema };
