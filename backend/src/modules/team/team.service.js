import * as teamRepo from "./team.repository.js";
import * as departmentRepo from "../department/department.repository.js";
import User from "../user/user.model.js";
import Employee from "../employee/employee.model.js";
import * as userService from "../user/user.service.js";

const createTeam = async (data) => {
    let finalManagerId = null;
    let tempPassword = null;
    let managerUsername = null;
    const bcrypt = await import("bcryptjs");

    if (data.managerId) {
        let managerUser = await User.findByPk(data.managerId);
        if (managerUser) {
            finalManagerId = managerUser.id;
            managerUsername = managerUser.username;

            // If user is not yet TL or temporary credentials explicitly requested
            if (managerUser.role !== 'TL' || data.generateCredentials) {
                managerUser.role = 'TL';
                managerUser.isTemporaryPassword = true;
                tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
                managerUser.password = await bcrypt.hash(tempPassword, 10);
                await managerUser.save();
            }

            // Ensure employee designation is Team Head
            let empRecord = await Employee.findOne({ where: { userId: finalManagerId } });
            if (!empRecord) {
                await Employee.create({
                    userId: finalManagerId,
                    designation: "Team Head",
                });
            } else {
                empRecord.designation = "Team Head";
                await empRecord.save();
            }
        }
    } else if (data.managerName) {
        let managerUser = await User.findOne({ where: { name: data.managerName } });

        if (!managerUser) {
            managerUsername = data.managerName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
            tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            managerUser = await User.create({
                name: data.managerName,
                username: managerUsername,
                email: `${managerUsername.toLowerCase()}@example.com`,
                password: hashedPassword,
                role: 'TL',
                isTemporaryPassword: true
            });
        } else {
            managerUser.role = 'TL';
            managerUser.isTemporaryPassword = true;
            tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
            managerUser.password = await bcrypt.hash(tempPassword, 10);
            await managerUser.save();
            managerUsername = managerUser.username;
        }

        finalManagerId = managerUser.id;
        
        let empRecord = await Employee.findOne({ where: { userId: finalManagerId } });
        if (!empRecord) {
            await Employee.create({
                userId: finalManagerId,
                designation: "Team Head",
            });
        } else {
            empRecord.designation = "Team Head";
            await empRecord.save();
        }
    }

    let finalDepartmentId = data.departmentId || null;
    const rawDeptName = (data.departmentName || data.department || '').trim();
    if (rawDeptName) {
        let dept = await departmentRepo.findByName(rawDeptName);
        if (!dept) {
            dept = await departmentRepo.create({ name: rawDeptName, status: "ACTIVE" });
        }
        finalDepartmentId = dept.id;
    }

    const payload = {
        name: data.name,
        status: data.status || 'ACTIVE',
        departmentId: finalDepartmentId,
        managerId: finalManagerId
    };

    const team = await teamRepo.create(payload);

    // Assign existing employees to the team if provided
    if (data.employeeIds && data.employeeIds.length > 0) {
        await Employee.update(
            { teamId: team.id },
            { where: { id: data.employeeIds } }
        );
    }
    
    // Create dummy employees if employeeCount is explicitly provided
    if (data.employeeCount && data.employeeCount > 0) {
        const defaultPassword = await bcrypt.hash("password123", 10);
        
        for (let i = 0; i < data.employeeCount; i++) {
            const empUsername = `employee_${team.id}_${i + 1}_${Math.floor(Math.random() * 1000)}`;
            const newEmpUser = await User.create({
                name: `Employee ${i + 1}`,
                username: empUsername,
                email: `${empUsername}@example.com`,
                password: defaultPassword,
                role: "EMPLOYEE",
                isTemporaryPassword: true,
            });
            
            await Employee.create({
                userId: newEmpUser.id,
                teamId: team.id,
                designation: "Team Member"
            });
        }
    }

    const result = team.toJSON ? team.toJSON() : team;
    
    if (managerUsername && tempPassword) {
        result.credentials = {
            username: managerUsername,
            password: tempPassword
        };
    }
    
    return result;
};

const getTeams = async (user) => {
    const teams = await teamRepo.findAll();
    
    if (user && (user.role === 'TL' || user.role === 'TEAM_LEAD')) {
        return teams.filter(t => t.managerId === user.id);
    }
    if (user && user.role === 'EMPLOYEE') {
        const emp = await Employee.findOne({ where: { userId: user.id } });
        if (!emp || !emp.teamId) return [];
        return teams.filter(t => t.id === emp.teamId);
    }
    return teams;
};

const getTeamById = async (id, user) => {
    const team = await teamRepo.findById(id);
    if (!team) {
        const err = new Error("Team not found");
        err.statusCode = 404;
        throw err;
    }
    if (user && (user.role === 'TL' || user.role === 'TEAM_LEAD')) {
        if (team.managerId !== user.id) {
            const err = new Error("Access denied to this team");
            err.statusCode = 403;
            throw err;
        }
    }
    if (user && user.role === 'EMPLOYEE') {
        const emp = await Employee.findOne({ where: { userId: user.id } });
        if (!emp || emp.teamId !== team.id) {
            const err = new Error("Access denied to this team");
            err.statusCode = 403;
            throw err;
        }
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

    const updatePayload = {};
    let tempPassword = null;
    let managerUsername = null;
    const bcrypt = await import("bcryptjs");

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId || null;

    const rawDeptName = (data.departmentName || data.department || '').trim();
    if (rawDeptName) {
        let dept = await departmentRepo.findByName(rawDeptName);
        if (!dept) {
            dept = await departmentRepo.create({ name: rawDeptName, status: "ACTIVE" });
        }
        updatePayload.departmentId = dept.id;
    }

    if (data.managerId !== undefined) {
        if (!data.managerId) {
            updatePayload.managerId = null;
        } else {
            let manager = await User.findByPk(data.managerId);
            if (manager) {
                updatePayload.managerId = manager.id;
                managerUsername = manager.username;

                if (manager.role !== 'TL' || data.generateCredentials) {
                    manager.role = 'TL';
                    manager.isTemporaryPassword = true;
                    tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
                    manager.password = await bcrypt.hash(tempPassword, 10);
                    await manager.save();
                }

                let empRecord = await Employee.findOne({ where: { userId: manager.id } });
                if (empRecord) {
                    empRecord.designation = "Team Head";
                    await empRecord.save();
                }
            }
        }
    } else if (data.managerName !== undefined) {
        if (data.managerName === "") {
            updatePayload.managerId = null;
        } else {
            let manager = await User.findOne({ where: { name: data.managerName } });
            if (!manager) {
                managerUsername = data.managerName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
                tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                
                manager = await User.create({
                    name: data.managerName,
                    username: managerUsername,
                    email: `${managerUsername.toLowerCase()}@example.com`,
                    password: hashedPassword,
                    role: 'TL',
                    isTemporaryPassword: true
                });
                
                await Employee.create({
                    userId: manager.id,
                    designation: "Team Head",
                });
            } else if (data.generateCredentials || manager.role !== 'TL') {
                manager.role = 'TL';
                manager.isTemporaryPassword = true;
                tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
                manager.password = await bcrypt.hash(tempPassword, 10);
                await manager.save();
                managerUsername = manager.username;
            }
            updatePayload.managerId = manager.id;
        }
    }

    // Handle employee assignment
    if (data.employeeIds !== undefined && Array.isArray(data.employeeIds)) {
        await Employee.update({ teamId: null }, { where: { teamId: id } });
        if (data.employeeIds.length > 0) {
            await Employee.update({ teamId: id }, { where: { id: data.employeeIds } });
        }
    }

    if (data.addEmployeeIds && data.addEmployeeIds.length > 0) {
        await Employee.update({ teamId: id }, { where: { id: data.addEmployeeIds } });
    }

    if (data.removeEmployeeIds && data.removeEmployeeIds.length > 0) {
        await Employee.update({ teamId: null }, { where: { id: data.removeEmployeeIds } });
    }

    const updatedTeam = await teamRepo.update(team, updatePayload);
    const result = updatedTeam.toJSON ? updatedTeam.toJSON() : updatedTeam;

    if (managerUsername && tempPassword) {
        result.credentials = {
            username: managerUsername,
            password: tempPassword
        };
    }

    return result;
};

const deleteTeam = async (id) => {
    const team = await teamRepo.findById(id);
    if (!team) {
        const err = new Error("Team not found");
        err.statusCode = 404;
        throw err;
    }

    // Unassign members before deletion
    await Employee.update({ teamId: null }, { where: { teamId: id } });

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
