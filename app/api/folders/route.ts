import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Folder from "@/models/Folder";
import { verifyToken } from "@/lib/auth";
import { FolderSchema } from "@/lib/validations";

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

        // Fetch all folders for the user
        const folders = await Folder.find({ owner: decoded.userId, isTrashed: false }).sort({ createdAt: -1 });

        // Helper to build tree structure
        const buildTree = (folders: any[], parentId: string | null = null): any[] => {
            return folders
                .filter((folder) => String(folder.parentFolder || null) === String(parentId))
                .map((folder) => ({
                    ...folder.toObject(),
                    children: buildTree(folders, String(folder._id)),
                }));
        };

        const folderTree = buildTree(folders, null);

        return NextResponse.json(folderTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const result = FolderSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        await connectToDatabase();

        const { name, parentFolder, color, icon } = result.data;

        const newFolder = await Folder.create({
            name,
            parentFolder: parentFolder || undefined,
            owner: decoded.userId,
            color,
            icon,
            path: parentFolder ? await getFolderPath(parentFolder) : `/${name}`,
        });

        return NextResponse.json(newFolder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to construct path (simplified)
async function getFolderPath(parentId: string): Promise<string> {
    const parent = await Folder.findById(parentId);
    return parent ? `${parent.path}/${parentId}` : "/";
}
