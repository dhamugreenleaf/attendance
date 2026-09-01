import bcrypt from "bcryptjs";
import { connectDB } from "./src/config/db.js";
import { sequelize, User } from "./src/models/index.js";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });
        
        const email = 'sanjay@gmail.com';
        const password = 'password123';
        
        const existingUser = await User.findOne({ where: { email } });
        
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name: 'Sanjay Admin',
                username: 'sanjay',
                email: email,
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            });
            console.log(`\n✅ Seed successful: Admin user created!\nEmail: ${email}\nPassword: ${password}\n`);
        } else {
            // Update password just in case they forgot it
            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.password = hashedPassword;
            await existingUser.save();
            console.log(`\n✅ Admin user already exists. Password reset to: ${password}\n`);
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
