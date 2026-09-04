import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Employee = sequelize.define(
    "Employee",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        teamId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        designation: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        joinDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        approvalStatus: {
            type: DataTypes.ENUM("APPROVED", "PENDING", "REJECTED"),
            allowNull: false,
            defaultValue: "APPROVED",
        },
    },
    {
        tableName: "employees",
        timestamps: true,
    }
);

export default Employee;
