import * as employeeService from "./employee.service.js";
import {
    createEmployeeSchema,
    updateEmployeeSchema,
    employeeIdSchema,
} from "./employee.zod.js";

const createEmployee = async (req, res, next) => {
    try {
        const data = createEmployeeSchema.parse(req.body);
        const result = await employeeService.createEmployee(data);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getEmployees = async (req, res, next) => {
    try {
        const result = await employeeService.getEmployees();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getEmployeeById = async (req, res, next) => {
    try {
        const { id } = employeeIdSchema.parse(req.params);
        const result = await employeeService.getEmployeeById(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const { id } = employeeIdSchema.parse(req.params);
        const data = updateEmployeeSchema.parse(req.body);
        const result = await employeeService.updateEmployee(id, data);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const { id } = employeeIdSchema.parse(req.params);
        const result = await employeeService.deleteEmployee(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
