"use client";

export const runtime = 'edge';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, ExternalLink, Calendar, Tag } from "lucide-react";
import Link from "next/link";

interface TransactionWithReceipt {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    receipt_url: string;
}

export default function ReceiptsPage() {
    const [transactions, setTransactions] = useState<TransactionWithReceipt[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        const fetchReceipts = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("id, description, amount, date, category, receipt_url")
                    .eq("user_id", user.id)
                    .not("receipt_url", "is", null)
                    .order("date", { ascending: false });

                if (error) throw error;
                setTransactions(data || []);
            } catch (error) {
                console.error("Error fetching receipts:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchReceipts();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center text-zinc-500">Please log in to view receipts.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Receipts Gallery</h1>
                <p className="text-zinc-400 text-sm">
                    {transactions.length} receipt{transactions.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p>No receipts found.</p>
                    <p className="text-sm mt-2">Add a transaction with a scanned receipt to see it here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="group relative rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-emerald-500/50 transition-colors">
                            <div className="aspect-[3/4] relative bg-zinc-950">
                                {/* We use a simple img tag here because Next.js Image optimization is disabled for Cloudflare */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tx.receipt_url}
                                    alt={`Receipt for ${tx.description}`}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <Link
                                        href={tx.receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Full Size
                                    </Link>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-white truncate pr-2" title={tx.description}>
                                        {tx.description}
                                    </h3>
                                    <span className="text-emerald-500 font-bold whitespace-nowrap">
                                        ₦{tx.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-zinc-500">
                                    <span className="flex items-center">
                                        <Tag className="mr-1 h-3 w-3" />
                                        {tx.category}
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {new Date(tx.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
