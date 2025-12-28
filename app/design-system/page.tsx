"use client";

import React, { useState } from "react";
import { StarBackground } from "@/components/ui/StarBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";

const DemoContent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    return (
        <div className="flex h-screen text-white overflow-hidden font-sans">
            <StarBackground />
            <Sidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">Buttons</h2>
                        <div className="flex gap-4 flex-wrap">
                            <Button onClick={() => showToast("Rocket launched!", "success")} showRocket>Launch</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">Inputs</h2>
                        <div className="max-w-md space-y-4">
                            <Input label="Username" placeholder="Enter username" />
                            <Input label="Email" error="Invalid email" defaultValue="wrong@email" />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">Cards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <h3 className="font-bold text-lg mb-2">Glass Card</h3>
                                <p className="text-white/60">This is a glassmorphism card with hover effect.</p>
                            </Card>
                            <Card>
                                <h3 className="font-bold text-lg mb-2">Another Card</h3>
                                <p className="text-white/60">Content goes here.</p>
                            </Card>
                            <Card className="flex items-center justify-center min-h-[150px]">
                                <LoadingSpinner />
                            </Card>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold">Overlays</h2>
                        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                    </section>
                </main>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Example Modal">
                <p className="mb-6">This is a modal with a backdrop blur effect and smooth animation.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                        showToast("Action confirmed", "info");
                        setIsModalOpen(false);
                    }}>Confirm</Button>
                </div>
            </Modal>
        </div>
    );
};

export default function DesignSystemPage() {
    return (
        <ToastProvider>
            <DemoContent />
        </ToastProvider>
    );
}
