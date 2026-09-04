import Employee from "./employee.model.js";
import User from "../user/user.model.js";
import Team from "../team/team.model.js";

const create = async (data) => {
    return await Employee.create(data);
};

const findAll = async () => {
    return await Employee.findAll({
        include: [
            { model: User, as: "user", attributes: ["id", "name", "email", "role"] },
            { model: Team, as: "team", attributes: ["id", "name", "managerId"] },
        ],
        order: [["id", "DESC"]],
    });
};

const findById = async (id) => {
    return await Employee.findByPk(id, {
        include: [
            { model: User, as: "user", attributes: ["id", "name", "email", "role"] },
            { model: Team, as: "team", attributes: ["id", "name", "managerId"] },
        ],
    });
};

const findByUserId = async (userId) => {
    return await Employee.findOne({ where: { userId } });
};

const update = async (employee, data) => {
    return await employee.update(data);
};

const remove = async (employee) => {
    return await employee.destroy();
};

const findByPhone = async (phone) => {
    return await Employee.findOne({ where: { phone } });
};

export { create, findAll, findById, findByUserId, findByPhone, update, remove };
