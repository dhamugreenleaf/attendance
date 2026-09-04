import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../user/user.model.js";

const login = async (identifier, password) => {
    // Identifier can be username or email
    const user = await User.findOne({ 
        where: { 
            [Op.or]: [
                { username: identifier },
                { email: identifier }
            ]
        } 
    });

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
        { 
            id: user.id, 
            role: user.role,
            isTemporaryPassword: user.isTemporaryPassword
        },
        process.env.JWT_SECRET || "defaultsecret",
        { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
};

const checkUsernameAvailability = async (username) => {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
        const error = new Error("Username is already taken");
        error.statusCode = 409;
        throw error;
    }
    return true;
};

const createAdminUser = async (userData) => {
    const { username, password, phoneNumber } = userData;
    
    // Check again before inserting
    await checkUsernameAvailability(username);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
        name: username, // Default name to username for now
        username,
        email: `${username}@company.com`, // mock email
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE"
    });
    
    const token = jwt.sign(
        { 
            id: user.id, 
            role: user.role,
            isTemporaryPassword: user.isTemporaryPassword
        },
        process.env.JWT_SECRET || "defaultsecret",
        { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);
    
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
        const error = new Error("Current password is incorrect");
        error.statusCode = 400;
        throw error;
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    user.isTemporaryPassword = false;
    await user.save();
    
    return true;
};

export { login, checkUsernameAvailability, createAdminUser, changePassword };
