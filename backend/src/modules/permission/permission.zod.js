import { z } from "zod";

const createPermissionSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM)"),
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
}).refine((data) => {
    const start = new Date(`1970-01-01T${data.startTime}`);
    const end = new Date(`1970-01-01T${data.endTime}`);
    return start < end;
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});

const updatePermissionStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
    approverRemarks: z.string().trim().max(500).optional(),
}).refine((data) => {
    if (data.status === "REJECTED" && (!data.approverRemarks || data.approverRemarks.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Approver remarks are required when rejecting a permission",
    path: ["approverRemarks"],
});

export { createPermissionSchema, updatePermissionStatusSchema };
