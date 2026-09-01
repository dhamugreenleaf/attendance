import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Permission = sequelize.define(
    "Permission",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "CANCELLED"),
            allowNull: false,
            defaultValue: "PENDING",
        },
        approverId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        approverRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "permissions",
        timestamps: true,
    }
);

export default Permission;
