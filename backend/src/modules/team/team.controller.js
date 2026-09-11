import * as teamService from "./team.service.js";
import {
    createTeamSchema,
    updateTeamSchema,
    teamIdSchema,
} from "./team.zod.js";

const createTeam = async (req, res, next) => {
    try {
        const data = createTeamSchema.parse(req.body);
        const result = await teamService.createTeam(data);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getTeams = async (req, res, next) => {
    try {
        const result = await teamService.getTeams(req.user);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getTeamById = async (req, res, next) => {
    try {
        const { id } = teamIdSchema.parse(req.params);
        const result = await teamService.getTeamById(id, req.user);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateTeam = async (req, res, next) => {
    try {
        const { id } = teamIdSchema.parse(req.params);
        const data = updateTeamSchema.parse(req.body);
        const result = await teamService.updateTeam(id, data);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const deleteTeam = async (req, res, next) => {
    try {
        const { id } = teamIdSchema.parse(req.params);
        const result = await teamService.deleteTeam(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
};
