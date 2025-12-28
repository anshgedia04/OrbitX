import Note from "@/models/Note";
import connectToDatabase from "./mongodb";
import mongoose from "mongoose";

export const STORAGE_LIMIT = 40 * 1024 * 1024; // 40MB in bytes

export async function calculateUserStorage(userId: string): Promise<number> {
    await connectToDatabase();

    // Aggregate size of all content fields
    // We confirm that we are summing the UTF-8 byte length of the content string
    const result = await Note.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isTrashed: false // Should we count trash? Usually yes, trash takes space. Let's count EVERYTHING owned by user.
            }
        },
        {
            $project: {
                contentSize: { $strLenBytes: "$content" } // $strLenBytes calculates byte size of string
            }
        },
        {
            $group: {
                _id: null,
                totalSize: { $sum: "$contentSize" }
            }
        }
    ]);

    return result.length > 0 ? result[0].totalSize : 0;
}
