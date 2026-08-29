import * as employeeRepo from "./employee.repository.js";
import * as userRepo from "../user/user.repository.js";
import * as teamRepo from "../team/team.repository.js";

const createEmployee = async (data) => {
    const user = await userRepo.findById(data.userId);
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }

    const existing = await employeeRepo.findByUserId(data.userId);
    if (existing) {
        const err = new Error("Employee profile already exists for this user");
        err.statusCode = 409;
        throw err;
    }

    if (data.teamId) {
        const team = await teamRepo.findById(data.teamId);
        if (!team) {
            const err = new Error("Team not found");
            err.statusCode = 404;
            throw err;
        }
    }

    return await employeeRepo.create(data);
};

const getEmployees = async () => {
    return await employeeRepo.findAll();
};

const getEmployeeById = async (id) => {
    const employee = await employeeRepo.findById(id);
    if (!employee) {
        const err = new Error("Employee not found");
        err.statusCode = 404;
        throw err;
    }
    return employee;
};

const updateEmployee = async (id, data) => {
    const employee = await employeeRepo.findById(id);
    if (!employee) {
        const err = new Error("Employee not found");
        err.statusCode = 404;
        throw err;
    }

    if (data.teamId && data.teamId !== employee.teamId) {
        const team = await teamRepo.findById(data.teamId);
        if (!team) {
            const err = new Error("Team not found");
            err.statusCode = 404;
            throw err;
        }
    }

    if (data.userId && data.userId !== employee.userId) {
        const existing = await employeeRepo.findByUserId(data.userId);
        if (existing) {
            const err = new Error("Another employee profile exists for this user");
            err.statusCode = 409;
            throw err;
        }
    }

    return await employeeRepo.update(employee, data);
};

const deleteEmployee = async (id) => {
    const employee = await employeeRepo.findById(id);
    if (!employee) {
        const err = new Error("Employee not found");
        err.statusCode = 404;
        throw err;
    }

    await employeeRepo.remove(employee);
    return { id, message: "Employee deleted successfully" };
};

export {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
