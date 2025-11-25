"use client";

import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Native date formatting to avoid adding dependency if not needed
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(date);
};

interface Transaction {
    id: string;
    amount: number;
    status: string;
    date: string;
    description: string;
    category: string;
    type: string;
}

export function RecentTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('date', { ascending: false })
                    .limit(5);

                if (error) throw error;

                setTransactions(data || []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();

        // Realtime subscription
        const channel = supabase
            .channel('transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                fetchTransactions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-zinc-500">Loading transactions...</div>;
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
                <button className="text-sm text-emerald-500 hover:text-emerald-400">View All</button>
            </div>
            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center text-zinc-500 py-4">No transactions yet</div>
                ) : (
                    transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                    {transaction.description?.[0] || "?"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{transaction.description}</p>
                                    <p className="text-xs text-zinc-500">{transaction.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        transaction.type === "income" ? "text-emerald-500" : "text-white"
                                    )}
                                >
                                    {transaction.type === "expense" ? "-" : "+"}₦{Math.abs(transaction.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-zinc-500">{formatDate(transaction.date)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
