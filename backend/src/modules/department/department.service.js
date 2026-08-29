import * as departmentRepo from "./department.repository.js";

const createDepartment = async (data) => {
    const existing = await departmentRepo.findByName(data.name);
    if (existing) {
        const err = new Error("Department with this name already exists");
        err.statusCode = 409;
        throw err;
    }
    return await departmentRepo.create(data);
};

const getDepartments = async () => {
    return await departmentRepo.findAll();
};

const getDepartmentById = async (id) => {
    const department = await departmentRepo.findById(id);
    if (!department) {
        const err = new Error("Department not found");
        err.statusCode = 404;
        throw err;
    }
    return department;
};

const updateDepartment = async (id, data) => {
    const department = await departmentRepo.findById(id);
    if (!department) {
        const err = new Error("Department not found");
        err.statusCode = 404;
        throw err;
    }

    if (data.name && data.name !== department.name) {
        const existing = await departmentRepo.findByName(data.name);
        if (existing) {
            const err = new Error("Department with this name already exists");
            err.statusCode = 409;
            throw err;
        }
    }

    return await departmentRepo.update(department, data);
};

const deleteDepartment = async (id) => {
    const department = await departmentRepo.findById(id);
    if (!department) {
        const err = new Error("Department not found");
        err.statusCode = 404;
        throw err;
    }

    await departmentRepo.remove(department);
    return { id, message: "Department deleted successfully" };
};

export {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
};
