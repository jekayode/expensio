"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

interface AddProjectExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export function AddProjectExpenseModal({ isOpen, onClose, projectId }: AddProjectExpenseModalProps) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number }[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isOpen && user) {
            const fetchData = async () => {
                // Fetch categories
                const { data: expenseData } = await supabase
                    .from("project_expenses")
                    .select("category")
                    .eq("user_id", user.id);

                if (expenseData) {
                    const unique = Array.from(new Set(expenseData.map(item => item.category))).sort();
                    setExistingCategories(unique);
                }

                // Fetch accounts
                const { data: accountsData } = await supabase
                    .from("accounts")
                    .select("id, name, balance")
                    .eq("user_id", user.id);

                if (accountsData) {
                    setAccounts(accountsData);
                    if (accountsData.length > 0) {
                        setSelectedAccountId(accountsData[0].id);
                    }
                }
            };
            fetchData();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!amount || !description || !category || !date || !user || !selectedAccountId) return;
        setIsSubmitting(true);

        try {
            const expenseAmount = parseFloat(amount);
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);

            if (!selectedAccount) throw new Error("Selected account not found");

            // 1. Insert Expense
            const { error: expenseError } = await supabase.from("project_expenses").insert({
                user_id: user.id,
                project_id: projectId,
                amount: expenseAmount,
                description,
                category,
                date: new Date(date).toISOString(),
                account_id: selectedAccountId
            });

            if (expenseError) throw expenseError;

            // 2. Update Account Balance
            const { error: balanceError } = await supabase
                .from("accounts")
                .update({ balance: selectedAccount.balance - expenseAmount })
                .eq("id", selectedAccountId);

            if (balanceError) {
                console.error("Error updating balance:", balanceError);
                // Ideally we would rollback the expense here, but for MVP we'll just alert
                alert("Expense added but failed to update account balance.");
            }

            onClose();
            setAmount("");
            setDescription("");
            setCategory("");
            setDate(new Date().toISOString().split('T')[0]);
            router.refresh();
        } catch (error) {
            console.error("Error adding project expense:", error);
            alert("Failed to add expense");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Add Project Expense</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-zinc-500">₦</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-4 text-white focus:border-emerald-500 focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Cement Bags"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                                placeholder="Select or type category"
                            />
                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-800 bg-zinc-900 shadow-lg">
                                        {existingCategories
                                            .filter(c => c.toLowerCase().includes(category.toLowerCase()))
                                            .map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setCategory(c);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        {category.length > 0 && !existingCategories.some(c => c.toLowerCase() === category.toLowerCase()) && (
                                            <div className="px-4 py-2 text-xs text-zinc-500 italic">
                                                New category: {category}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Payment Account</label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none appearance-none"
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} (₦{account.balance.toLocaleString()})
                                </option>
                            ))}
                            {accounts.length === 0 && <option value="">No accounts found</option>}
                        </select>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !amount || !description || !category || !selectedAccountId}
                        className="w-full flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors mt-4 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Expense"}
                    </button>
                </div>
            </div>
        </div>
    );
}
