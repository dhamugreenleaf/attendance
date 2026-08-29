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
            type: DataTypes.ENUM("PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"),
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
