// User Service
import bcrypt from "bcryptjs";

import * as userRepository from "./user.repository.js";

const createUser = async (userData) => {
    const {
        name,
        username,
        email,
        password,
        role,
        status,
        isTemporaryPassword
    } = userData;

    // Check username
    const existingUsername =
        await userRepository.findByUsername(username);

    if (existingUsername) {
        const error = new Error("Username already exists");
        error.statusCode = 409;
        throw error;
    }

    // Check email
    const existingEmail =
        await userRepository.findByEmail(email);

    if (existingEmail) {
        const error = new Error("Email already exists");
        error.statusCode = 409;
        throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
        name,
        username,
        email,
        password: hashedPassword,
        role,
        status,
        isTemporaryPassword: isTemporaryPassword || false
    });

    // Never return password
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
};

const getUsers = async (query) => {
    const page = Math.max(Number(query.page) || 1, 1);

    const limit = Math.min(
        Math.max(Number(query.limit) || 10, 1),
        100
    );

    const search = query.search?.trim() || null;
    const role = query.role || null;
    const status = query.status || null;

    const result = await userRepository.findAll({
        page,
        limit,
        search,
        role,
        status,
    });

    return {
        users: result.rows,
        pagination: {
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        },
    };
};

const getUserById = async (id) => {
    const user = await userRepository.findById(id);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    return user;
};

const updateUser = async (id, userData) => {
    const user =
        await userRepository.findByIdWithPassword(id);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    // Check username
    if (userData.username) {
        const existingUsername =
            await userRepository.findByUsernameExceptId(
                userData.username,
                id
            );

        if (existingUsername) {
            const error = new Error(
                "Username already exists"
            );
            error.statusCode = 409;
            throw error;
        }
    }

    // Check email
    if (userData.email) {
        const existingEmail =
            await userRepository.findByEmailExceptId(
                userData.email,
                id
            );

        if (existingEmail) {
            const error = new Error(
                "Email already exists"
            );
            error.statusCode = 409;
            throw error;
        }
    }

    // Hash password if changed
    if (userData.password) {
        userData.password = await bcrypt.hash(
            userData.password,
            12
        );
    }

    await userRepository.update(user, userData);

    const updatedUser =
        await userRepository.findById(id);

    return updatedUser;
};

const changeUserStatus = async (id, status) => {
    const user =
        await userRepository.findByIdWithPassword(id);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    await userRepository.update(user, { status });

    return await userRepository.findById(id);
};

const deleteUser = async (id) => {
    const user =
        await userRepository.findByIdWithPassword(id);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    await userRepository.remove(user);

    return {
        id,
        message: "User deleted successfully",
    };
};

export {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    changeUserStatus,
    deleteUser,
};