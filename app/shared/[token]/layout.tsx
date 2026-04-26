import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';

export async function generateMetadata(
  props: { params: Promise<{ token: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const { token } = params;

    try {
        await dbConnect();
        // Lean query for speed, only fetching needed fields
        const note = await Note.findOne({ shareToken: token }).select('title content').lean();

        if (!note) {
            return {
                title: "Note Not Found | OrbitX Notes",
                description: "This note may have been deleted or the link is invalid.",
            };
        }

        const snippet = note.content.length > 150 
            ? note.content.substring(0, 150) + "..." 
            : note.content;

        return {
            title: `${note.title} | OrbitX Notes`,
            description: snippet,
            openGraph: {
                title: note.title,
                description: snippet,
                type: "article",
                siteName: "OrbitX Notes",
            },
            twitter: {
                card: "summary",
                title: note.title,
                description: snippet,
            }
        };
    } catch (error) {
        return {
            title: "OrbitX Notes",
            description: "View this shared note in hyperspace.",
        };
    }
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
