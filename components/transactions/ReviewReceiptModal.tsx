"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

interface ScannedItem {
    name: string;
    amount: number;
    category: string;
    budget_id?: string;
}

interface ScannedData {
    store: string;
    date: string;
    items: ScannedItem[];
    total: number;
    receiptUrl?: string;
}

interface ReviewReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    scannedData: ScannedData | null;
    onSuccess: () => void;
}

export function ReviewReceiptModal({ isOpen, onClose, scannedData, onSuccess }: ReviewReceiptModalProps) {
    const [items, setItems] = useState<ScannedItem[]>([]);
    const [store, setStore] = useState("");
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
    const [budgets, setBudgets] = useState<{ id: string; name: string; category: string }[]>([]);

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (scannedData) {
            setItems(scannedData.items || []);
            setStore(scannedData.store || "");
            setDate(scannedData.date || new Date().toISOString().split('T')[0]);
        }
    }, [scannedData]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            // Fetch categories
            const { data: catData } = await supabase
                .from("transactions")
                .select("category")
                .eq("user_id", user.id);

            if (catData) {
                const unique = Array.from(new Set(catData.map(item => item.category))).sort();
                setSuggestedCategories(unique);
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

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, user]);

    if (!isOpen || !scannedData) return null;

    const handleItemChange = (index: number, field: keyof ScannedItem, value: string | number) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleBudgetSelect = (index: number, budgetId: string) => {
        const budget = budgets.find(b => b.id === budgetId);
        const newItems = [...items];
        if (budget) {
            newItems[index] = {
                ...newItems[index],
                budget_id: budgetId,
                category: budget.category,
                name: budget.name // Optional: overwrite name or keep scanned name? Let's overwrite for consistency with AddTransaction
            };
        } else {
            newItems[index] = {
                ...newItems[index],
                budget_id: undefined
            };
        }
        setItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // Create transactions for each item
            const transactions = items.map(item => ({
                user_id: user.id,
                amount: item.amount,
                category: item.category,
                description: `${store} - ${item.name}`,
                date: date,
                type: "expense",
                receipt_url: scannedData.receiptUrl // Save the receipt URL
            }));

            const { error } = await supabase
                .from("transactions")
                .insert(transactions);

            if (error) throw error;

            onSuccess();
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Error saving receipt transactions:", error);
            alert("Failed to save transactions");
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl my-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Review Receipt</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Store / Merchant</label>
                        <input
                            type="text"
                            value={store}
                            onChange={(e) => setStore(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-6">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder-zinc-600 font-medium"
                                            placeholder="Item Name"
                                        />
                                    </div>
                                    <div className="w-1/3">
                                        <select
                                            value={item.budget_id || ""}
                                            onChange={(e) => handleBudgetSelect(index, e.target.value)}
                                            className="w-full rounded bg-zinc-900 py-1 px-2 text-xs text-zinc-300 border border-zinc-800 focus:border-emerald-500 focus:outline-none appearance-none"
                                        >
                                            <option value="">Map to Budget...</option>
                                            {budgets.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={item.category}
                                            onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                            list={`category-suggestions-${index}`}
                                            className="w-full rounded bg-zinc-900 py-1 px-2 text-xs text-zinc-300 border border-zinc-800 focus:border-emerald-500 focus:outline-none"
                                            placeholder="Category"
                                        />
                                        <datalist id={`category-suggestions-${index}`}>
                                            {suggestedCategories.map(cat => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                            <div className="w-24">
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-zinc-500 text-sm">₦</span>
                                    <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(index, "amount", parseFloat(e.target.value))}
                                        className="w-full rounded bg-zinc-900 py-1 pl-6 pr-2 text-sm text-white border border-zinc-800 focus:border-emerald-500 focus:outline-none text-right"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteItem(index)}
                                className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-zinc-900 rounded transition-colors mt-0.5"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                    <div>
                        <p className="text-sm text-zinc-400">Total Items: {items.length}</p>
                        <p className="text-xl font-bold text-white">Total: ₦{total.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting || items.length === 0}
                            className="flex items-center px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Save {items.length} Transactions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
