"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wallet, Building2, Banknote, TrendingUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ data: Account | null, mode: "create" | "edit" }>({ data: null, mode: "create" });
    const { user, loading: authLoading } = useAuth();

    const fetchAccounts = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from("accounts")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            fetchAccounts();
        }

        const channel = supabase
            .channel('accounts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, fetchAccounts)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, authLoading, fetchAccounts]);

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'savings': return Building2;
            case 'investment': return TrendingUp;
            default: return Wallet;
        }
    };

    const getColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'savings': return "bg-blue-500";
            case 'investment': return "bg-purple-500";
            default: return "bg-emerald-500";
        }
    };

    const totalAvailableBalance = accounts
        .filter(a => a.type.toLowerCase() !== 'investment')
        .reduce((sum, a) => sum + a.balance, 0);

    const totalInvestment = accounts
        .filter(a => a.type.toLowerCase() === 'investment')
        .reduce((sum, a) => sum + a.balance, 0);

    if (authLoading) return <div className="p-8 text-center text-zinc-500">Loading auth...</div>;
    if (!user) return <div className="p-8 text-center text-zinc-500">Please log in to view accounts.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Accounts</h1>
                <button
                    onClick={() => {
                        setModalData({ data: null, mode: "create" });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="text-sm text-zinc-400">Total Available Balance</p>
                    <p className="text-3xl font-bold text-white mt-2">₦{totalAvailableBalance.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500 mt-1">Excludes investments</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="text-sm text-zinc-400">Total Investments</p>
                    <p className="text-3xl font-bold text-white mt-2">₦{totalInvestment.toLocaleString()}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    No accounts added yet. Click &quot;Add Account&quot; to get started.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => {
                        const Icon = getIcon(account.type);
                        const color = getColor(account.type);

                        return (
                            <div key={account.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white", color)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{account.name}</h3>
                                            <p className="text-xs text-zinc-500 capitalize">{account.type}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-zinc-400">Current Balance</p>
                                    <p className="text-2xl font-bold text-white">₦{account.balance.toLocaleString()}</p>
                                </div>

                                <div className="mt-4 flex justify-end space-x-2">
                                    <button
                                        onClick={() => {
                                            setModalData({ data: account, mode: "edit" });
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Edit Account"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this account?")) return;
                                            try {
                                                const { error } = await supabase.from("accounts").delete().eq("id", account.id);
                                                if (error) throw error;
                                                fetchAccounts();
                                            } catch (error) {
                                                console.error("Error deleting account:", error);
                                                alert("Failed to delete account");
                                            }
                                        }}
                                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={modalData.data}
                mode={modalData.mode}
                onSuccess={fetchAccounts}
            />
        </div>
    );
}
