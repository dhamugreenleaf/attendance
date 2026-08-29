import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Department = sequelize.define(
    "Department",
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
            allowNull: false,
            defaultValue: "ACTIVE",
        },
    },
    {
        tableName: "departments",
        timestamps: true,
    }
);

export default Department;
