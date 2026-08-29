import { z } from "zod";

const createTeamSchema = z.object({
    name: z.string().trim().min(2).max(100),
    departmentId: z.coerce.number().int().positive(),
    managerId: z.coerce.number().int().positive().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateTeamSchema = createTeamSchema.partial();

const teamIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export { createTeamSchema, updateTeamSchema, teamIdSchema };
