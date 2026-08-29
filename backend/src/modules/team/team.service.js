import * as teamRepo from "./team.repository.js";
import * as departmentRepo from "../department/department.repository.js";

const createTeam = async (data) => {
    // Check if team name exists
    const existing = await teamRepo.findByName(data.name);
    if (existing) {
        const err = new Error("Team with this name already exists");
        err.statusCode = 409;
        throw err;
    }

    // Verify department exists
    const dept = await departmentRepo.findById(data.departmentId);
    if (!dept) {
        const err = new Error("Department not found");
        err.statusCode = 404;
        throw err;
    }

    return await teamRepo.create(data);
};

const getTeams = async () => {
    return await teamRepo.findAll();
};

const getTeamById = async (id) => {
    const team = await teamRepo.findById(id);
    if (!team) {
        const err = new Error("Team not found");
        err.statusCode = 404;
        throw err;
    }
    return team;
};

const updateTeam = async (id, data) => {
    const team = await teamRepo.findById(id);
    if (!team) {
        const err = new Error("Team not found");
        err.statusCode = 404;
        throw err;
    }

    if (data.name && data.name !== team.name) {
        const existing = await teamRepo.findByName(data.name);
        if (existing) {
            const err = new Error("Team with this name already exists");
            err.statusCode = 409;
            throw err;
        }
    }

    if (data.departmentId && data.departmentId !== team.departmentId) {
        const dept = await departmentRepo.findById(data.departmentId);
        if (!dept) {
            const err = new Error("Department not found");
            err.statusCode = 404;
            throw err;
        }
    }

    return await teamRepo.update(team, data);
};

const deleteTeam = async (id) => {
    const team = await teamRepo.findById(id);
    if (!team) {
        const err = new Error("Team not found");
        err.statusCode = 404;
        throw err;
    }

    await teamRepo.remove(team);
    return { id, message: "Team deleted successfully" };
};

export {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
};
