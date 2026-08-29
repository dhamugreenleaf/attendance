import { z } from "zod";

const createUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(100, "Name cannot exceed 100 characters"),

    username: z
        .string()
        .trim()
        .min(3, "Username must contain at least 3 characters")
        .max(50, "Username cannot exceed 50 characters")
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Username can contain only letters, numbers, dot, underscore and hyphen"
        ),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(150, "Email cannot exceed 150 characters"),

    password: z
        .string()
        .min(6, "Password must contain at least 6 characters")
        .max(100, "Password cannot exceed 100 characters"),

    role: z
        .enum(["ADMIN", "HR", "MANAGER", "TL", "EMPLOYEE"])
        .default("EMPLOYEE"),

    status: z
        .enum(["ACTIVE", "INACTIVE"])
        .default("ACTIVE"),
});

const updateUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    username: z
        .string()
        .trim()
        .min(3)
        .max(50)
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Invalid username format"
        )
        .optional(),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(150)
        .optional(),

    password: z
        .string()
        .min(6)
        .max(100)
        .optional(),

    role: z
        .enum(["ADMIN", "HR", "MANAGER", "TL", "EMPLOYEE"])
        .optional(),

    status: z
        .enum(["ACTIVE", "INACTIVE"])
        .optional(),
});

const userIdSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive(),
});

export {
    createUserSchema,
    updateUserSchema,
    userIdSchema,
};