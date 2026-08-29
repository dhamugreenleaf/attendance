import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Team = sequelize.define(
    "Team",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        departmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        managerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
            allowNull: false,
            defaultValue: "ACTIVE",
        },
    },
    {
        tableName: "teams",
        timestamps: true,
    }
);

export default Team;
