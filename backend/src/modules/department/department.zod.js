import { z } from "zod";

const createDepartmentSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().trim().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

const departmentIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createDepartmentSchema, updateDepartmentSchema, departmentIdSchema };
