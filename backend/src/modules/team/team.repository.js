import Team from "./team.model.js";
import Department from "../department/department.model.js";
import User from "../user/user.model.js";
import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";

const create = async (data) => {
    return await Team.create(data);
};

const findAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const [teams, todayAttendance] = await Promise.all([
        Team.findAll({
            include: [
                { model: Department, as: "department", attributes: ["id", "name"] },
                { model: User, as: "manager", attributes: ["id", "name", "email", "username"] },
                { model: Employee, as: "members", attributes: ["id", "userId", "designation", "approvalStatus"] },
            ],
            order: [["name", "ASC"]],
        }),
        Attendance.findAll({
            where: { date: today },
            attributes: ["id", "employeeId", "status"]
        })
    ]);
    
    return teams.map(team => {
        const teamJSON = team.toJSON();
        teamJSON.employeeCount = teamJSON.members ? teamJSON.members.length : 0;

        // Calculate real attendance for today based on team members
        if (teamJSON.members && teamJSON.members.length > 0) {
            const memberIds = teamJSON.members.map(m => m.id);
            const teamRecords = todayAttendance.filter(a => memberIds.includes(a.employeeId));
            
            if (teamRecords.length > 0) {
                const present = teamRecords.filter(r => r.status === 'PRESENT').length;
                const late = teamRecords.filter(r => r.status === 'LATE').length;
                const absent = teamRecords.filter(r => r.status === 'ABSENT').length;
                const leave = teamRecords.filter(r => r.status === 'ON_LEAVE').length;
                teamJSON.attendanceSummary = {
                    hasData: true,
                    total: teamRecords.length,
                    present,
                    late,
                    absent,
                    leave
                };
            } else {
                teamJSON.attendanceSummary = null;
            }
        } else {
            teamJSON.attendanceSummary = null;
        }

        return teamJSON;
    });
};

const findById = async (id) => {
    const today = new Date().toISOString().split('T')[0];

    const [team, todayAttendance] = await Promise.all([
        Team.findByPk(id, {
            include: [
                { model: Department, as: "department", attributes: ["id", "name"] },
                { model: User, as: "manager", attributes: ["id", "name", "email", "username"] },
                { 
                    model: Employee, 
                    as: "members", 
                    attributes: ["id", "userId", "teamId", "designation", "phone", "approvalStatus", "joinDate"],
                    include: [
                        { model: User, as: "user", attributes: ["id", "name", "username", "email", "role", "status"] }
                    ]
                },
            ],
        }),
        Attendance.findAll({
            where: { date: today },
            attributes: ["id", "employeeId", "status"]
        })
    ]);
    
    if (team) {
        const teamJSON = team.toJSON();
        teamJSON.employeeCount = teamJSON.members ? teamJSON.members.length : 0;

        if (teamJSON.members && teamJSON.members.length > 0) {
            const memberIds = teamJSON.members.map(m => m.id);
            const teamRecords = todayAttendance.filter(a => memberIds.includes(a.employeeId));
            
            if (teamRecords.length > 0) {
                const present = teamRecords.filter(r => r.status === 'PRESENT').length;
                const late = teamRecords.filter(r => r.status === 'LATE').length;
                const absent = teamRecords.filter(r => r.status === 'ABSENT').length;
                const leave = teamRecords.filter(r => r.status === 'ON_LEAVE').length;
                teamJSON.attendanceSummary = {
                    hasData: true,
                    total: teamRecords.length,
                    present,
                    late,
                    absent,
                    leave
                };
            } else {
                teamJSON.attendanceSummary = null;
            }
        } else {
            teamJSON.attendanceSummary = null;
        }

        return teamJSON;
    }
    return team;
};

const findByName = async (name) => {
    return await Team.findOne({ where: { name } });
};

const findByManagerId = async (managerId) => {
    return await Team.findOne({ where: { managerId } });
};

const update = async (team, data) => {
    return await team.update(data);
};

const remove = async (team) => {
    return await team.destroy();
};

export { create, findAll, findById, findByName, findByManagerId, update, remove };
