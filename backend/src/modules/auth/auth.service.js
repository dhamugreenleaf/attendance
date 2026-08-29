import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../user/user.model.js";

const login = async (email, password) => {
    const user = await User.findOne({ where: { email } });

    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    if (user.status !== "ACTIVE") {
        const error = new Error("Account is inactive");
        error.statusCode = 403;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "defaultsecret",
        { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
};

export { login };
