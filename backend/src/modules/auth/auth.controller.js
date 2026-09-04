import * as authService from "./auth.service.js";
import { loginSchema, signupSchema, verifyOtpSchema } from "./auth.zod.js";
import { generateMockOtp, verifyMockOtp } from "./otp.service.js";

const login = async (req, res, next) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const result = await authService.login(
            validatedData.username,
            validatedData.password
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const signup = async (req, res, next) => {
    try {
        const validatedData = signupSchema.parse(req.body);
        
        // Ensure username is not taken
        await authService.checkUsernameAvailability(validatedData.username);

        // Generate OTP
        const otp = await generateMockOtp(validatedData.phoneNumber, validatedData);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully. Please check server console.",
            data: { phoneNumber: validatedData.phoneNumber }
        });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const validatedData = verifyOtpSchema.parse(req.body);
        
        // Verify OTP and get pending user data
        const pendingUserData = await verifyMockOtp(validatedData.phoneNumber, validatedData.otp);
        
        if (!pendingUserData) {
            const error = new Error("Invalid or expired OTP");
            error.statusCode = 400;
            throw error;
        }

        // Create Admin user
        const result = await authService.createAdminUser(pendingUserData);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = req.user.toJSON();
        delete user.password;

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new password are required" });
        }

        await authService.changePassword(req.user.id, currentPassword, newPassword);

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export { login, signup, verifyOtp, changePassword, getMe };
