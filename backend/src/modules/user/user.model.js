import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        role: {
            type: DataTypes.ENUM(
                "ADMIN",
                "HR",
                "MANAGER",
                "TL",
                "EMPLOYEE"
            ),
            allowNull: false,
            defaultValue: "EMPLOYEE",
        },

        status: {
            type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
            allowNull: false,
            defaultValue: "ACTIVE",
        },
    },
    {
        tableName: "users",
        timestamps: true,
    }
);

export default User;