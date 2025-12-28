import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        let token;
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            token = req.cookies.get("token")?.value;
        }

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await connectToDatabase();

        const mongoose = require('mongoose');
        const userIdObj = new mongoose.Types.ObjectId(decoded.userId);

        // Aggregate counts by month for the last 6 months
        // We use $month and $year operators
        const stats = await Note.aggregate([
            {
                $match: {
                    owner: userIdObj,
                    isTrashed: false,
                    // Optional: Filter for last 6 or 12 months for better performance if needed
                    // createdAt: { $gte: sixMonthsAgo } 
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Helper to format month name
        const getMonthName = (date: Date) => {
            return date.toLocaleString('default', { month: 'short' });
        };

        // Generate 5-month window: [Current-2, Current-1, Current, Current+1, Current+2]
        const today = new Date();
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();

        const windowData = [];
        for (let i = -2; i <= 2; i++) {
            const d = new Date(currentYear, currentMonth + i, 1);
            const m = d.getMonth() + 1; // 1-12 for DB comparison
            const y = d.getFullYear();

            // Find stats for this month
            const stat = stats.find(s => s._id.month === m && s._id.year === y);

            windowData.push({
                name: getMonthName(d),
                notes: stat ? stat.count : 0,
                year: y,
                month: m
            });
        }

        const chartData = windowData;

        // If no data, maybe return empty structure or the frontend handles it?
        // Let's ensure if it's completely empty, we send something empty array

        return NextResponse.json(chartData);

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
