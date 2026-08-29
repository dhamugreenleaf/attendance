import { sequelize } from "../config/db.js";

import User from "../modules/user/user.model.js";
import Department from "../modules/department/department.model.js";
import Team from "../modules/team/team.model.js";
import Employee from "../modules/employee/employee.model.js";
import Attendance from "../modules/attendance/attendance.model.js";

// --- Relationships ---

// Department 1:N Team
Department.hasMany(Team, { foreignKey: "departmentId", as: "teams" });
Team.belongsTo(Department, { foreignKey: "departmentId", as: "department" });

// User 1:N Team (Manager)
User.hasMany(Team, { foreignKey: "managerId", as: "managedTeams" });
Team.belongsTo(User, { foreignKey: "managerId", as: "manager" });

// User 1:1 Employee
User.hasOne(Employee, { foreignKey: "userId", as: "employeeProfile", onDelete: "CASCADE" });
Employee.belongsTo(User, { foreignKey: "userId", as: "user" });

// Team 1:N Employee
Team.hasMany(Employee, { foreignKey: "teamId", as: "members" });
Employee.belongsTo(Team, { foreignKey: "teamId", as: "team" });

// Employee 1:N Attendance
Employee.hasMany(Attendance, { foreignKey: "employeeId", as: "attendanceRecords", onDelete: "CASCADE" });
Attendance.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });


export {
    sequelize,
    User,
    Department,
    Team,
    Employee,
    Attendance
};
