// User Repository
import User from "./user.model.js";
import { Op } from "sequelize";

const create = async (userData) => {
    return await User.create(userData);
};

const findAll = async ({ page, limit, search, role, status }) => {
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
        where[Op.or] = [
            {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
            },
            {
                username: {
                    [Op.iLike]: `%${search}%`,
                },
            },
            {
                email: {
                    [Op.iLike]: `%${search}%`,
                },
            },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (status) {
        where.status = status;
    }

    return await User.findAndCountAll({
        where,
        attributes: {
            exclude: ["password"],
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });
};

const findById = async (id) => {
    return await User.findByPk(id, {
        attributes: {
            exclude: ["password"],
        },
    });
};

const findByIdWithPassword = async (id) => {
    return await User.findByPk(id);
};

const findByUsername = async (username) => {
    return await User.findOne({
        where: { username },
    });
};

const findByEmail = async (email) => {
    return await User.findOne({
        where: { email },
    });
};

const findByUsernameExceptId = async (username, id) => {
    return await User.findOne({
        where: {
            username,
            id: {
                [Op.ne]: id,
            },
        },
    });
};

const findByEmailExceptId = async (email, id) => {
    return await User.findOne({
        where: {
            email,
            id: {
                [Op.ne]: id,
            },
        },
    });
};

const update = async (user, userData) => {
    return await user.update(userData);
};

const remove = async (user) => {
    return await user.destroy();
};

export {
    create,
    findAll,
    findById,
    findByIdWithPassword,
    findByUsername,
    findByEmail,
    findByUsernameExceptId,
    findByEmailExceptId,
    update,
    remove,
};