import { z } from "zod";

const createEmployeeSchema = z.object({
    userId: z.coerce.number().int().positive(),
    teamId: z.coerce.number().int().positive().optional(),
    designation: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    joinDate: z.string().date().optional(), // YYYY-MM-DD
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const employeeIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createEmployeeSchema, updateEmployeeSchema, employeeIdSchema };
