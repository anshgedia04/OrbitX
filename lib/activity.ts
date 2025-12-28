import Activity from "@/models/Activity";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

/**
 * Logs a user activity to the database.
 * This is a fire-and-forget operation that shouldn't block the main response.
 */
export async function logActivity(
    userId: string | mongoose.Types.ObjectId,
    type: "create" | "edit" | "delete" | "restore" | "move",
    targetId: string | mongoose.Types.ObjectId,
    targetTitle: string,
    targetType: "note" | "folder"
) {
    try {
        // Ensure DB connection (might be redundant if called within an API route, but safe)
        await connectToDatabase();

        await Activity.create({
            user: userId,
            type,
            targetId,
            targetTitle,
            targetType
        });
    } catch (error) {
        // Fail silently to avoid breaking the main user action
        console.error("Failed to log activity:", error);
    }
}
