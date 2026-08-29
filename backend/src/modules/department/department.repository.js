import Department from "./department.model.js";

const create = async (data) => {
    return await Department.create(data);
};

const findAll = async () => {
    return await Department.findAll({
        order: [["name", "ASC"]],
    });
};

const findById = async (id) => {
    return await Department.findByPk(id);
};

const findByName = async (name) => {
    return await Department.findOne({ where: { name } });
};

const update = async (department, data) => {
    return await department.update(data);
};

const remove = async (department) => {
    return await department.destroy();
};

export { create, findAll, findById, findByName, update, remove };
