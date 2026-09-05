import { sequelize } from "../config/db.js";

import User from "../modules/user/user.model.js";
import Department from "../modules/department/department.model.js";
import Team from "../modules/team/team.model.js";
import Employee from "../modules/employee/employee.model.js";
import Attendance from "../modules/attendance/attendance.model.js";
import Leave from "../modules/leave/leave.model.js";
import Permission from "../modules/permission/permission.model.js";
import { Notification } from "../modules/notification/notification.model.js";

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

// Employee 1:N Leave
Employee.hasMany(Leave, { foreignKey: "employeeId", as: "leaves", onDelete: "CASCADE" });
Leave.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Leave.belongsTo(User, { foreignKey: "approverId", as: "approver" });

// Employee 1:N Permission
Employee.hasMany(Permission, { foreignKey: "employeeId", as: "permissions", onDelete: "CASCADE" });
Permission.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Permission.belongsTo(User, { foreignKey: "approverId", as: "approver" });

// User 1:N Notification
User.hasMany(Notification, { foreignKey: "userId", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });


export {
    sequelize,
    User,
    Department,
    Team,
    Employee,
    Attendance,
    Leave,
    Permission,
    Notification
};
