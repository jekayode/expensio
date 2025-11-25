"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { ReceiptUploader } from "@/components/transactions/ReceiptUploader";
import { ReviewReceiptModal } from "@/components/transactions/ReviewReceiptModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";



export default function TransactionsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const fetchTransactions = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchTransactions();
        }

        const channel = supabase
            .channel('transactions_page_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, authLoading]);

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) {
        return <div className="p-8 text-center text-zinc-500">Loading auth...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-zinc-500">Please log in to view transactions.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Transactions</h1>
                <div className="flex gap-3">
                    <ReceiptUploader
                        onScanComplete={(data) => {
                            setScannedData(data);
                            setIsReviewModalOpen(true);
                        }}
                    />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <button className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950/50 text-zinc-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Description</th>
                            <th className="px-6 py-3 font-medium">Category</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                    Loading transactions...
                                </td>
                            </tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{transaction.description}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                            transaction.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                                        )}>
                                            {transaction.status || 'completed'}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-medium",
                                        transaction.type === "income" ? "text-emerald-500" : "text-white"
                                    )}>
                                        {transaction.type === "expense" ? "-" : "+"}₦{Math.abs(transaction.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <ReviewReceiptModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                scannedData={scannedData}
                onSuccess={fetchTransactions}
            />
        </div>
    );
}
