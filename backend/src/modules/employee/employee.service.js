import * as employeeRepo from "./employee.repository.js";
import * as userRepo from "../user/user.repository.js";
import * as teamRepo from "../team/team.repository.js";
import * as userService from "../user/user.service.js";

const createEmployee = async (data, reqUser = null) => {
    let userId = data.userId;

    if (data.phone) {
        const phoneExists = await employeeRepo.findByPhone(data.phone);
        if (phoneExists) {
            const err = new Error("An employee with this phone number already exists.");
            err.statusCode = 400;
            throw err;
        }
    }

    if (!userId) {
        if (!data.name || !data.phone) {
            const err = new Error("Name and phone are required to create a new employee");
            err.statusCode = 400;
            throw err;
        }

        const username = data.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 10000);
        const email = data.email || `${username}@example.com`;
        const password = data.password || "password123";

        const newUser = await userService.createUser({
            name: data.name,
            username,
            email,
            password,
            role: "EMPLOYEE",
            status: "ACTIVE",
            isTemporaryPassword: true
        });
        userId = newUser.id;
    }

    const user = await userRepo.findById(userId);
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }

    const existing = await employeeRepo.findByUserId(userId);
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
    } else if (reqUser && reqUser.role === 'TL') {
        // Automatically assign to the TL's team if they didn't provide one
        const tlTeam = await teamRepo.findByManagerId(reqUser.id);
        if (tlTeam) {
            data.teamId = tlTeam.id;
        }
    }

    const approvalStatus = (reqUser && reqUser.role === 'TL') ? 'PENDING' : 'APPROVED';

    const employeeData = { ...data, userId, approvalStatus };
    return await employeeRepo.create(employeeData);
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

const updateEmployee = async (id, data, user = null) => {
    const employee = await employeeRepo.findById(id);
    if (!employee) {
        const err = new Error("Employee not found");
        err.statusCode = 404;
        throw err;
    }

    if (data.phone && data.phone !== employee.phone) {
        const phoneExists = await employeeRepo.findByPhone(data.phone);
        if (phoneExists) {
            const err = new Error("An employee with this phone number already exists.");
            err.statusCode = 400;
            throw err;
        }
    }

    if (user && user.role === 'TL') {
        if (employee.team?.managerId !== user.id) {
            const err = new Error("Not authorized to update this employee");
            err.statusCode = 403;
            throw err;
        }
        // TL can only modify specific fields
        const allowedData = {};
        if (data.designation !== undefined) allowedData.designation = data.designation;
        if (data.phone !== undefined) allowedData.phone = data.phone;
        // TL can remove from team, but not assign to other teams
        if (data.teamId === null) allowedData.teamId = null;
        if (data.name) allowedData.name = data.name; // We handle name below
        data = allowedData;
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
    
    // Update name / status in user model if provided
    if (employee.userId && (data.name || data.status)) {
        const empUser = await userRepo.findById(employee.userId);
        if (empUser) {
            if (data.name) empUser.name = data.name;
            if (data.status) empUser.status = data.status;
            await empUser.save();
        }
        delete data.name;
        delete data.status;
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
