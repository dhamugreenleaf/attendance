import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Attendance = sequelize.define(
    "Attendance",
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
        punchInTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        punchOutTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "OVERTIME"),
            allowNull: false,
            defaultValue: "ABSENT",
        },
    },
    {
        tableName: "attendance_records",
        timestamps: true,
    }
);

export default Attendance;
