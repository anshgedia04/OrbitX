"use client";

import React, { Suspense } from "react";
import { NoteEditor } from "@/components/editor/NoteEditor";

export default function NewNotePage() {
    return (
        <div className="h-full">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-white/50">Loading editor...</div>}>
                <NoteEditor mode="create" />
            </Suspense>
        </div>
    );
}
