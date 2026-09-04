import { z } from "zod";

const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, "Username/Email is required"),
    password: z
        .string()
        .min(1, "Password is required"),
});

const signupSchema = z.object({
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phoneNumber: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number format"),
});

const verifyOtpSchema = z.object({
    phoneNumber: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export { loginSchema, signupSchema, verifyOtpSchema };
