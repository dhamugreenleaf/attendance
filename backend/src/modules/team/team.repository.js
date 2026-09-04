import Team from "./team.model.js";
import Department from "../department/department.model.js";
import User from "../user/user.model.js";
import Employee from "../employee/employee.model.js";

const create = async (data) => {
    return await Team.create(data);
};

const findAll = async () => {
    const teams = await Team.findAll({
        include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
            { model: Employee, as: "members", attributes: ["id"] },
        ],
        order: [["name", "ASC"]],
    });
    
    return teams.map(team => {
        const teamJSON = team.toJSON();
        teamJSON.employeeCount = teamJSON.members ? teamJSON.members.length : 0;
        return teamJSON;
    });
};

const findById = async (id) => {
    const team = await Team.findByPk(id, {
        include: [
            { model: Department, as: "department", attributes: ["id", "name"] },
            { model: User, as: "manager", attributes: ["id", "name", "email"] },
            { model: Employee, as: "members", attributes: ["id"] },
        ],
    });
    
    if (team) {
        const teamJSON = team.toJSON();
        teamJSON.employeeCount = teamJSON.members ? teamJSON.members.length : 0;
        return teamJSON;
    }
    return team;
};

const findByName = async (name) => {
    return await Team.findOne({ where: { name } });
};

const findByManagerId = async (managerId) => {
    return await Team.findOne({ where: { managerId } });
};

const update = async (team, data) => {
    return await team.update(data);
};

const remove = async (team) => {
    return await team.destroy();
};

export { create, findAll, findById, findByName, findByManagerId, update, remove };
