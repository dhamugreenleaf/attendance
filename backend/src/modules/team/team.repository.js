import Team from "./team.model.js";
import Department from "../department/department.model.js";
import User from "../user/user.model.js";

const create = async (data) => {
    return await Team.create(data);
};

const findAll = async () => {
    return await Team.findAll({
        include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
        ],
        order: [["name", "ASC"]],
    });
};

const findById = async (id) => {
    return await Team.findByPk(id, {
        include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
        ],
    });
};

const findByName = async (name) => {
    return await Team.findOne({ where: { name } });
};

const update = async (team, data) => {
    return await team.update(data);
};

const remove = async (team) => {
    return await team.destroy();
};

export { create, findAll, findById, findByName, update, remove };
