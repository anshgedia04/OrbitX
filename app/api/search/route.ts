import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import Folder from '@/models/Folder';
import Tag from '@/models/Tag';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = decoded.userId;
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type'); // 'note', 'folder', 'tag', or undefined for all

        if (!query) {
            return NextResponse.json([]);
        }

        const regex = new RegExp(query, 'i'); // Case-insensitive regex

        const results: any = {
            notes: [],
            folders: [],
            tags: []
        };

        // Search Notes
        if (!type || type === 'note') {
            results.notes = await Note.find({
                owner: userId,
                isTrashed: false,
                $or: [
                    { title: regex },
                    { content: regex },
                    { tags: regex }
                ]
            })
                .select('title content type tags updatedAt folder')
                .populate('folder', 'name')
                .sort({ updatedAt: -1 })
                .limit(10);
        }

        // Search Folders
        if (!type || type === 'folder') {
            results.folders = await Folder.find({
                owner: userId,
                name: regex
            })
                .select('name path color icon updatedAt')
                .limit(5);
        }

        // Search Tags
        if (!type || type === 'tag') {
            results.tags = await Tag.find({
                owner: userId,
                name: regex
            })
                .select('name count color')
                .limit(5);
        }

        // Flatten results for the modal if no specific type requested
        if (!type) {
            const flattened = [
                ...results.notes.map((n: any) => ({ ...n.toObject(), resultType: 'note' })),
                ...results.folders.map((f: any) => ({ ...f.toObject(), resultType: 'folder' })),
                ...results.tags.map((t: any) => ({ ...t.toObject(), resultType: 'tag' }))
            ];
            return NextResponse.json(flattened);
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
