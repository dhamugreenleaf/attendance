import { z } from "zod";

const createTeamSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    departmentId: z.coerce.number().int().positive().nullable().optional(),
    departmentName: z.string().trim().optional(),
    department: z.string().trim().optional(),
    managerId: z.coerce.number().int().positive().nullable().optional(),
    managerName: z.string().trim().optional(),
    employeeCount: z.coerce.number().int().min(0).optional(),
    employeeIds: z.array(z.number().int().positive()).optional(),
    addEmployeeIds: z.array(z.number().int().positive()).optional(),
    removeEmployeeIds: z.array(z.number().int().positive()).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    generateCredentials: z.boolean().optional(),
    description: z.string().trim().optional(),
});

const updateTeamSchema = createTeamSchema.partial();

const teamIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createTeamSchema, updateTeamSchema, teamIdSchema };
