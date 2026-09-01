import Leave from "./leave.model.js";
import Employee from "../employee/employee.model.js";
import User from "../user/user.model.js";
import { createLeaveSchema, updateLeaveStatusSchema } from "./leave.zod.js";

// @route   POST /api/leave
// @desc    Create a leave request for the authenticated employee
// @access  EMPLOYEE (or higher if creating for self)
export const createLeave = async (req, res) => {
    try {
        const validatedData = createLeaveSchema.parse(req.body);

        // Find the employee record for the logged in user
        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee profile not found for this user." });
        }

        const leave = await Leave.create({
            ...validatedData,
            employeeId: employee.id,
            status: "PENDING",
        });

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   GET /api/leave/my-requests
// @desc    Get all leave requests for the authenticated employee
// @access  EMPLOYEE (or higher)
export const getMyLeaves = async (req, res) => {
    try {
        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        const leaves = await Leave.findAll({
            where: { employeeId: employee.id },
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: User,
                    as: "approver",
                    attributes: ["id", "firstName", "lastName", "email"],
                }
            ]
        });

        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   GET /api/leave/pending
// @desc    Get pending leave requests (for HR/ADMIN/MANAGER to approve)
// @access  ADMIN, HR, MANAGER, TL
export const getPendingLeaves = async (req, res) => {
    try {
        // In a real system, you'd filter by the Manager's teamId or TL's teamId.
        // For simplicity in this demo, if they have access to this route, we fetch PENDING.
        const leaves = await Leave.findAll({
            where: { status: "PENDING" },
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: Employee,
                    as: "employee",
                    include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }]
                }
            ]
        });

        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   PUT /api/leave/:id/status
// @desc    Approve/Reject or Cancel a leave
// @access  ADMIN, HR, MANAGER, TL (or EMPLOYEE for Cancel)
export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateLeaveStatusSchema.parse(req.body);

        const leave = await Leave.findByPk(id);
        if (!leave) {
            return res.status(404).json({ success: false, message: "Leave request not found." });
        }

        // If employee is cancelling their own request
        if (validatedData.status === "CANCELLED") {
            const employee = await Employee.findOne({ where: { userId: req.user.id } });
            if (leave.employeeId !== employee?.id) {
                return res.status(403).json({ success: false, message: "You can only cancel your own leave requests." });
            }
            if (leave.status !== "PENDING") {
                return res.status(400).json({ success: false, message: "Can only cancel pending requests." });
            }
        } 
        // If Manager/HR is approving/rejecting
        else {
            // Ensure the user has approver roles
            if (!["ADMIN", "HR", "MANAGER", "TL"].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: "Unauthorized to approve/reject leaves." });
            }
            leave.approverId = req.user.id;
            leave.approverRemarks = validatedData.approverRemarks || null;
        }

        leave.status = validatedData.status;
        await leave.save();

        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
