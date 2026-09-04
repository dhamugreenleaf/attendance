import Attendance from "./attendance.model.js";
import Employee from "../employee/employee.model.js";
import { Op } from "sequelize";

const create = async (data) => {
    return await Attendance.create(data);
};

const findByEmployeeAndDate = async (employeeId, date) => {
    return await Attendance.findOne({
        where: {
            employeeId,
            date,
        },
    });
};

const findAll = async () => {
    return await Attendance.findAll({
        include: [{ model: Employee, as: "employee" }],
        order: [["date", "DESC"]],
    });
};

const findByEmployeeId = async (employeeId) => {
    return await Attendance.findAll({
        where: { employeeId },
        order: [["date", "DESC"]],
    });
};

const findById = async (id) => {
    return await Attendance.findByPk(id);
};

const update = async (attendance, data) => {
    return await attendance.update(data);
};

const bulkUpsert = async (records) => {
    // Sequelize bulkCreate with updateOnDuplicate works well for upsert
    return await Attendance.bulkCreate(records, {
        updateOnDuplicate: ["status", "punchInTime", "updatedAt"]
    });
};

const findByTeamAndDate = async (teamId, date) => {
    return await Attendance.findAll({
        where: { date },
        include: [
            { 
                model: Employee, 
                as: "employee", 
                where: { teamId } 
            }
        ],
    });
};

export { create, findByEmployeeAndDate, findAll, findByEmployeeId, findById, update, bulkUpsert, findByTeamAndDate };
