import Permission from "./permission.model.js";
import Employee from "../employee/employee.model.js";
import User from "../user/user.model.js";
import { createPermissionSchema, updatePermissionStatusSchema } from "./permission.zod.js";

// @route   POST /api/permission
// @desc    Create a permission request for the authenticated employee
// @access  EMPLOYEE (or higher if creating for self)
export const createPermission = async (req, res) => {
    try {
        const validatedData = createPermissionSchema.parse(req.body);

        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        const permission = await Permission.create({
            ...validatedData,
            employeeId: employee.id,
            status: "PENDING",
        });

        res.status(201).json({ success: true, data: permission });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   GET /api/permission/my-requests
// @desc    Get all permission requests for the authenticated employee
// @access  EMPLOYEE (or higher)
export const getMyPermissions = async (req, res) => {
    try {
        const employee = await Employee.findOne({ where: { userId: req.user.id } });
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        const permissions = await Permission.findAll({
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

        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   GET /api/permission/pending
// @desc    Get pending permission requests
// @access  ADMIN, HR, MANAGER, TL
export const getPendingPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({
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

        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @route   PUT /api/permission/:id/status
// @desc    Approve/Reject or Cancel a permission
// @access  ADMIN, HR, MANAGER, TL (or EMPLOYEE for Cancel)
export const updatePermissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updatePermissionStatusSchema.parse(req.body);

        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission request not found." });
        }

        if (validatedData.status === "CANCELLED") {
            const employee = await Employee.findOne({ where: { userId: req.user.id } });
            if (permission.employeeId !== employee?.id) {
                return res.status(403).json({ success: false, message: "You can only cancel your own requests." });
            }
            if (permission.status !== "PENDING") {
                return res.status(400).json({ success: false, message: "Can only cancel pending requests." });
            }
        } 
        else {
            if (!["ADMIN", "HR", "MANAGER", "TL"].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: "Unauthorized to approve/reject permissions." });
            }
            permission.approverId = req.user.id;
            permission.approverRemarks = validatedData.approverRemarks || null;
        }

        permission.status = validatedData.status;
        await permission.save();

        res.status(200).json({ success: true, data: permission });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
