import cron from 'node-cron';
import { Op } from 'sequelize';
import { User, Attendance } from '../models/index.js';
import { Notification } from '../modules/notification/notification.model.js';

export const startCronJobs = () => {
    // 1. Daily morning portal open notification (e.g. 8:00 AM)
    cron.schedule('0 8 * * 1-5', async () => {
        try {
            console.log('Running daily morning portal open notification task');
            const users = await User.findAll({ where: { status: 'ACTIVE' } });

            const notifications = users.map(user => ({
                userId: user.id,
                title: 'Portal Open',
                message: 'Good morning! The attendance portal is now open for today.',
                isRead: false
            }));

            if (notifications.length > 0) {
                await Notification.bulkCreate(notifications);
            }
        } catch (error) {
            console.error('Error in morning portal notification cron:', error);
        }
    });

    // 2. Pre-shift reminder to mark attendance (e.g. 8:45 AM)
    cron.schedule('45 8 * * 1-5', async () => {
        try {
            console.log('Running pre-shift reminder task');

            const todayStr = new Date().toISOString().split('T')[0];

            const users = await User.findAll({
                where: { status: 'ACTIVE', role: { [Op.in]: ['EMPLOYEE', 'TL'] } }
            });

            for (const user of users) {
                const employeeProfile = await user.getEmployeeProfile();
                if (!employeeProfile) continue;

                const hasAttendance = await Attendance.findOne({
                    where: {
                        employeeId: employeeProfile.id,
                        date: todayStr
                    }
                });

                if (!hasAttendance) {
                    await Notification.create({
                        userId: user.id,
                        title: 'Shift Starting Soon',
                        message: 'Your shift starts in 15 minutes. Don\'t forget to mark your attendance!',
                        isRead: false
                    });
                }
            }
        } catch (error) {
            console.error('Error in pre-shift reminder cron:', error);
        }
    });

    // 3. Hourly checks from 9 AM to 6 PM (e.g. 9:00, 10:00...18:00)
    // Runs at the 0th minute of every hour between 9 and 18, Monday-Friday
    cron.schedule('0 9-18 * * 1-5', async () => {
        try {
            console.log('Running hourly attendance check task');
            const todayStr = new Date().toISOString().split('T')[0];

            const users = await User.findAll({
                where: { status: 'ACTIVE', role: { [Op.in]: ['EMPLOYEE', 'TL'] } }
            });

            for (const user of users) {
                // To safely check attendance, we need the Employee record
                const employeeProfile = await user.getEmployeeProfile();
                if (!employeeProfile) continue;

                const hasAttendance = await Attendance.findOne({
                    where: {
                        employeeId: employeeProfile.id,
                        date: todayStr
                    }
                });

                if (!hasAttendance) {
                    await Notification.create({
                        userId: user.id,
                        title: 'Attendance Reminder',
                        message: 'You have not marked your attendance for today yet. Please mark it in the portal.',
                        isRead: false
                    });
                }
            }
        } catch (error) {
            console.error('Error in hourly attendance check cron:', error);
        }
    });

    console.log('Cron jobs scheduled successfully');
};
