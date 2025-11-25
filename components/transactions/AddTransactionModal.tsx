"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Category } from "@/types";

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingCategories, setExistingCategories] = useState<Category[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number }[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [budgets, setBudgets] = useState<{ id: string; name: string; category: string }[]>([]);
    const [selectedBudget, setSelectedBudget] = useState("");
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isOpen && user) {
            setDate(new Date().toISOString().split('T')[0]); // Reset date on open
            const fetchData = async () => {
                // Fetch categories
                const { data: catData } = await supabase
                    .from("categories")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("name");

                if (catData) {
                    setExistingCategories(catData);
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

                // Fetch active budgets for current month
                const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
                const { data: budgetData } = await supabase
                    .from("budgets")
                    .select("id, name, category")
                    .eq("user_id", user.id)
                    .eq("month", currentMonth)
                    .order("name");

                if (budgetData) {
                    setBudgets(budgetData);
                }
            };
            fetchData();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleAutoCategorize = () => {
        if (!description) return;
        setIsCategorizing(true);
        // Mock AI delay - we'll replace this with real AI later
        setTimeout(() => {
            const mockCategories: Record<string, string> = {
                grocery: "Food",
                coffee: "Food",
                uber: "Transport",
                netflix: "Entertainment",
                salary: "Income",
                rent: "Housing",
            };

            const lowerDesc = description.toLowerCase();
            const found = Object.keys(mockCategories).find(key => lowerDesc.includes(key));
            setCategory(found ? mockCategories[found] : "Uncategorized");
            setIsCategorizing(false);
        }, 1000);
    };

    const handleBudgetSelect = (budgetId: string) => {
        setSelectedBudget(budgetId);
        const budget = budgets.find(b => b.id === budgetId);
        if (budget) {
            setCategory(budget.category);
            setDescription(budget.name);
        } else {
            // Reset if cleared (optional, depending on UX preference)
        }
    };

    const handleSubmit = async () => {
        if (!amount || !description || !category || !user || !selectedAccountId || !date) return;
        setIsSubmitting(true);

        try {
            const txAmount = parseFloat(amount);
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);

            if (!selectedAccount) throw new Error("Selected account not found");

            // 1. Insert Transaction
            const { error: txError } = await supabase.from("transactions").insert({
                user_id: user.id,
                amount: txAmount,
                description,
                category,
                type: "expense", // Defaulting to expense for now
                date: date, // Use selected date
                status: "completed",
                account_id: selectedAccountId
            });

            if (txError) throw txError;

            // 2. Update Account Balance
            const { error: balanceError } = await supabase
                .from("accounts")
                .update({ balance: selectedAccount.balance - txAmount })
                .eq("id", selectedAccountId);

            if (balanceError) {
                console.error("Error updating balance:", balanceError);
                alert("Transaction added but failed to update account balance.");
            }

            onClose();
            setAmount("");
            setDescription("");
            setCategory("");
            setSelectedBudget("");
            router.refresh(); // Refresh server components to show new data
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("Failed to add transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
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
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Budget Item (Optional)</label>
                        <select
                            value={selectedBudget}
                            onChange={(e) => handleBudgetSelect(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none appearance-none"
                        >
                            <option value="">Select a budget item...</option>
                            {budgets.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} ({b.category})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Grocery Store"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-zinc-400">Category</label>
                            <button
                                onClick={handleAutoCategorize}
                                disabled={isCategorizing || !description}
                                className="flex items-center text-xs text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                            >
                                {isCategorizing ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-1 h-3 w-3" />
                                )}
                                Auto-categorize
                            </button>
                        </div>
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
                            {showDropdown && (category.length > 0 || existingCategories.length > 0) && (
                                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-800 bg-zinc-900 shadow-lg">
                                    {existingCategories
                                        .filter(c => c.name.toLowerCase().includes(category.toLowerCase()))
                                        .map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setCategory(c.name);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex justify-between"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-xs text-zinc-500 capitalize">{c.group}</span>
                                            </button>
                                        ))}
                                    {category.length > 0 && !existingCategories.some(c => c.name.toLowerCase() === category.toLowerCase()) && (
                                        <div className="px-4 py-2 text-xs text-zinc-500 italic">
                                            New category: {category} (will be unmanaged)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {showDropdown && (
                            <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowDropdown(false)}
                            />
                        )}
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
                        className="w-full flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Transaction"}
                    </button>
                </div>
            </div>
        </div>
    );
}
