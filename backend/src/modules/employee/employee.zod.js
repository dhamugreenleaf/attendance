import { z } from "zod";

const createEmployeeSchema = z.object({
    userId: z.coerce.number().int().positive().optional(),
    teamId: z.coerce.number().int().positive().optional(),
    designation: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    joinDate: z.string().date().optional(), // YYYY-MM-DD
    name: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const employeeIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createEmployeeSchema, updateEmployeeSchema, employeeIdSchema };
