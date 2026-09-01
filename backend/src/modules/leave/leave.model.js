import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Leave = sequelize.define(
    "Leave",
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
        type: {
            type: DataTypes.ENUM("CASUAL", "SICK", "ANNUAL", "UNPAID"),
            allowNull: false,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
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
        tableName: "leaves",
        timestamps: true,
    }
);

export default Leave;
