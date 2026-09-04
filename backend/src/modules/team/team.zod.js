import { z } from "zod";

const createTeamSchema = z.object({
    name: z.string().trim().min(2).max(100),
    managerName: z.string().trim().optional(),
    employeeCount: z.coerce.number().int().min(0).optional(),
    employeeIds: z.array(z.number().int().positive()).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateTeamSchema = createTeamSchema.partial();

const teamIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createTeamSchema, updateTeamSchema, teamIdSchema };
