import * as departmentService from "./department.service.js";
import {
    createDepartmentSchema,
    updateDepartmentSchema,
    departmentIdSchema,
} from "./department.zod.js";

const createDepartment = async (req, res, next) => {
    try {
        const data = createDepartmentSchema.parse(req.body);
        const result = await departmentService.createDepartment(data);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getDepartments = async (req, res, next) => {
    try {
        const result = await departmentService.getDepartments();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getDepartmentById = async (req, res, next) => {
    try {
        const { id } = departmentIdSchema.parse(req.params);
        const result = await departmentService.getDepartmentById(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const { id } = departmentIdSchema.parse(req.params);
        const data = updateDepartmentSchema.parse(req.body);
        const result = await departmentService.updateDepartment(id, data);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const { id } = departmentIdSchema.parse(req.params);
        const result = await departmentService.deleteDepartment(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};
