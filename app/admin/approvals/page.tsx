"use client";

import React, { useState } from "react";
import { Check, X, Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

// Dummy data for UI visualization
const MOCK_TRANSACTIONS = [
    {
        id: "tx_123456789",
        userId: "user_001",
        email: "alice@example.com",
        transactionId: "UPI-29384823",
        plan: "Pro Yearly",
        amount: "₹999",
        status: "pending",
        date: "2024-12-09T10:30:00Z"
    },
    {
        id: "tx_987654321",
        userId: "user_002",
        email: "bob@test.com",
        transactionId: "UPI-88374722",
        plan: "Pro Monthly",
        amount: "₹99",
        status: "pending",
        date: "2024-12-09T14:15:00Z"
    },
    {
        id: "tx_456123789",
        userId: "user_003",
        email: "charlie@demo.com",
        transactionId: "PAYPAL-99283",
        plan: "Pro Yearly",
        amount: "₹999",
        status: "pending",
        date: "2024-12-10T09:00:00Z"
    }
];

export default function AdminApprovalsPage() {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
    const [searchTerm, setSearchTerm] = useState("");

    const handleApprove = (id: string) => {
        showToast("Transaction approved (UI Demo)", "success");
        // In real app, this would call API
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleReject = (id: string) => {
        showToast("Transaction rejected (UI Demo)", "error");
        // In real app, this would call API
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Pending Approvals</h2>
                    <p className="text-white/50 text-sm">Review and approve manual payment requests.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search email or ID..."
                            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" leftIcon={<RefreshCw size={14} />}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-white/5 p-0 bg-[#0F132E]/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Transaction ID</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Plan</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-medium text-white/40 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm">{tx.email}</span>
                                                <span className="text-white/30 text-xs">ID: {tx.userId}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-xs bg-white/5 border border-white/10 rounded px-2 py-1 inline-block text-accent">
                                                {tx.transactionId}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white/80 text-sm">{tx.plan}</span>
                                                <span className="text-white/40 text-xs">{tx.amount}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-white/50 text-sm">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                                                    onClick={() => handleReject(tx.id)}
                                                >
                                                    <X size={14} className="mr-1" /> Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20"
                                                    onClick={() => handleApprove(tx.id)}
                                                >
                                                    <Check size={14} className="mr-1" /> Approve
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/30">
                                        No pending approvals found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
