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

export { punchInSchema, punchOutSchema, attendanceIdSchema };
