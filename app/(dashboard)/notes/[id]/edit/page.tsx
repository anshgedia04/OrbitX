"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function EditNotePage() {
    const params = useParams();
    const router = useRouter();
    const [note, setNote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await fetch(`/api/notes/${params.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch note");
                }
                const data = await response.json();
                setNote(data);
            } catch (err) {
                setError("Note not found or you don't have permission to view it");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchNote();
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                <p className="text-white/50 mb-4">{error}</p>
                <button
                    onClick={() => router.push("/")}
                    className="text-primary hover:underline"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="h-full">
            <NoteEditor mode="edit" initialData={note} />
        </div>
    );
}
