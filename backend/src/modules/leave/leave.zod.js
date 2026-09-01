import { z } from "zod";

const createLeaveSchema = z.object({
    type: z.enum(["CASUAL", "SICK", "ANNUAL", "UNPAID"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
});

const updateLeaveStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
    approverRemarks: z.string().trim().max(500).optional(),
}).refine((data) => {
    if (data.status === "REJECTED" && (!data.approverRemarks || data.approverRemarks.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Approver remarks are required when rejecting a leave",
    path: ["approverRemarks"],
});

export { createLeaveSchema, updateLeaveStatusSchema };
