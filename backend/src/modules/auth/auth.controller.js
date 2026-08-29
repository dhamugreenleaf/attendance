import * as authService from "./auth.service.js";
import { loginSchema } from "./auth.zod.js";

const login = async (req, res, next) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const result = await authService.login(
            validatedData.email,
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

export { login, getMe };
