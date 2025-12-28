import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/auth";
import { NoteSchema } from "@/lib/validations";
import { calculateUserStorage, STORAGE_LIMIT } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

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

        const { searchParams } = new URL(req.url);
        const folder = searchParams.get("folder");
        const tag = searchParams.get("tag");
        const favorite = searchParams.get("favorite");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const query: any = { owner: decoded.userId, isTrashed: false };

        // Handle recursive folder filtering
        if (folder) {
            // 1. Fetch all folders for the user to build the tree/graph (efficient enough for typical usage)
            // We import Folder here to avoid circular dependency issues if any, though imports relate to models usually fine.
            // Using require or just using the imported Folder model if sure. 
            // Note: Folder is filtered by owner.
            const allUserFolders = await import("@/models/Folder").then(m => m.default.find({ owner: decoded.userId }).select('_id parentFolder'));

            // 2. Find all descendants of the requested folder
            const getDescendantIds = (rootIds: string[], allFolders: any[]) => {
                let descendants: string[] = [...rootIds];
                let queue = [...rootIds];

                while (queue.length > 0) {
                    const currentId = queue.shift();
                    const children = allFolders.filter(f => String(f.parentFolder) === String(currentId));
                    const childIds = children.map(c => String(c._id));
                    descendants.push(...childIds);
                    queue.push(...childIds);
                }
                return descendants;
            };

            const descendantIds = getDescendantIds([folder], allUserFolders);

            // 3. Query notes in any of these folders
            query.folder = { $in: descendantIds };
        }

        if (tag) query.tags = tag;
        if (favorite === "true") query.isFavorite = true;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
            ];
        }

        // Select only needed fields for list view to reduce payload size
        // Exclude content if it's too large, or just select what we need
        const notes = await Note.find(query)
            .select("title type tags isFavorite updatedAt folder language isShared")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Note.countDocuments(query);

        const response = NextResponse.json({
            notes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });

        // Add caching headers for performance
        // Cache for 60 seconds, revalidate after
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

        return response;
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
        const result = NoteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        await connectToDatabase();

        const { title, content, type, folder, tags, isFavorite, language } = result.data;

        // Check storage limit
        const currentUsage = await calculateUserStorage(decoded.userId);
        const newNoteSize = Buffer.byteLength(content || "", 'utf8');

        if (currentUsage + newNoteSize > STORAGE_LIMIT) {
            return NextResponse.json({
                error: "Storage limit exceeded",
                code: "STORAGE_LIMIT_EXCEEDED"
            }, { status: 403 });
        }

        const newNote = await Note.create({
            title,
            content: content || "",
            type: type || "markdown",
            folder: folder || undefined,
            owner: decoded.userId,
            tags: tags || [],
            isFavorite: isFavorite || false,
            language,
            versions: [],
        });

        // Log activity
        await logActivity(decoded.userId, "create", newNote._id, newNote.title, "note");

        return NextResponse.json(newNote, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
