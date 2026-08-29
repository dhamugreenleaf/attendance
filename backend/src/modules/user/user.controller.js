// User Controller
import * as userService from "./user.service.js";
import {
    createUserSchema,
    updateUserSchema,
    userIdSchema,
} from "./user.zod.js";

const createUser = async (req, res, next) => {
    try {
        const validatedData =
            createUserSchema.parse(req.body);

        const user =
            await userService.createUser(validatedData);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const result =
            await userService.getUsers(req.query);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } =
            userIdSchema.parse(req.params);

        const user =
            await userService.getUserById(id);

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } =
            userIdSchema.parse(req.params);

        const validatedData =
            updateUserSchema.parse(req.body);

        const user =
            await userService.updateUser(
                id,
                validatedData
            );

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const changeUserStatus = async (req, res, next) => {
    try {
        const { id } =
            userIdSchema.parse(req.params);

        const { status } =
            updateUserSchema
                .pick({ status: true })
                .required()
                .parse(req.body);

        const user =
            await userService.changeUserStatus(
                id,
                status
            );

        return res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } =
            userIdSchema.parse(req.params);

        const result =
            await userService.deleteUser(id);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

export {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    changeUserStatus,
    deleteUser,
};