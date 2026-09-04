import * as teamRepo from "./team.repository.js";
import * as departmentRepo from "../department/department.repository.js";
import User from "../user/user.model.js";
import Employee from "../employee/employee.model.js";
import * as userService from "../user/user.service.js";

const createTeam = async (data) => {
    let finalManagerId = null;
    let tempPassword = null;
    let managerUsername = null;

    if (data.managerName) {
        // Find user by name to use as manager
        let managerUser = await User.findOne({ where: { name: data.managerName } });
        const bcrypt = await import("bcryptjs");

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
            // Upgrade them to TL
            managerUser.role = 'TL';
            managerUser.isTemporaryPassword = true;
            
            // Generate new temporary password
            tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
            managerUser.password = await bcrypt.hash(tempPassword, 10);
            await managerUser.save();
            
            managerUsername = managerUser.username;
        }

        finalManagerId = managerUser.id;
        
        // Ensure they have an employee record as Team Head
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

    const payload = {
        name: data.name,
        status: data.status,
        departmentId: null,
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
    
    // Create dummy employees if employeeCount is provided
    if (data.employeeCount && data.employeeCount > 0) {
        const bcrypt = await import("bcryptjs");
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

    const updatePayload = { ...data };

    if (data.managerName !== undefined) {
        if (data.managerName === "") {
            updatePayload.managerId = null;
        } else {
            let manager = await User.findOne({ where: { name: data.managerName } });
            if (!manager) {
                const bcrypt = await import("bcryptjs");
                const managerUsername = data.managerName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
                const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
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
            }
            updatePayload.managerId = manager.id;
        }
        delete updatePayload.managerName;
    }

    return await teamRepo.update(team, updatePayload);
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
