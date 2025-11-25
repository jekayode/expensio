"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Category } from "@/types";

interface CreateBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        id?: string;
        name: string;
        category: string;
        amount_limit: number;
        month: string;
    } | null;
    mode?: "create" | "edit" | "duplicate";
    onSuccess?: () => void;
}

interface BulkItem {
    id: string;
    sourceName: string;
    category: string;
    amount: string;
}

export function CreateBudgetModal({ isOpen, onClose, initialData, mode: operationMode = "create", onSuccess }: CreateBudgetModalProps) {
    const [inputMode, setInputMode] = useState<"single" | "bulk">("single");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [limit, setLimit] = useState("");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [bulkText, setBulkText] = useState("");
    const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([]);

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Pre-fill for Edit or Duplicate
                setName(initialData.name);
                setCategory(initialData.category);
                setLimit(initialData.amount_limit.toString());

                if (operationMode === "duplicate") {
                    // For duplicate, maybe default to next month? 
                    // Or keep same month and let user change it.
                    // Let's keep same month but user can change.
                    // Actually, usually you duplicate to next month.
                    // Let's parse the initial month and add 1 month if it's duplicate?
                    // For now, let's keep it simple: use the passed month.
                    setMonth(initialData.month.slice(0, 7));
                } else {
                    if (initialData.month) {
                        setMonth(initialData.month.slice(0, 7));
                    } else {
                        setMonth(new Date().toISOString().slice(0, 7));
                    }
                }

                setInputMode("single"); // Force single mode for edit/duplicate
            } else {
                // Reset for Create
                setMonth(new Date().toISOString().slice(0, 7));
                setInputMode("single");
                setName("");
                setCategory("");
                setLimit("");
                setBulkText("");
                setBulkItems([]);
                setIsPreviewing(false);
            }
        }
    }, [isOpen, initialData, operationMode]);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("categories")
                .select("*")
                .eq("user_id", user.id)
                .order("name");

            if (data) {
                setSuggestedCategories(data);
            }
        };

        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const autoCategorize = (name: string): string => {
        const lowerName = name.toLowerCase();

        // 1. Try to match with existing categories first
        const exactMatch = suggestedCategories.find(c => c.name.toLowerCase() === lowerName);
        if (exactMatch) return exactMatch.name;

        // 2. Try partial match with existing categories
        const partialMatch = suggestedCategories.find(c => lowerName.includes(c.name.toLowerCase()));
        if (partialMatch) return partialMatch.name;

        // 3. Fallback to rules
        const rules: Record<string, string> = {
            "pepper": "Food", "onions": "Food", "elubo": "Food", "plantain": "Food",
            "ginger": "Food", "ewedu": "Food", "efo": "Food", "ponmo": "Food",
            "ata": "Food", "veggies": "Food", "fruits": "Food", "panla": "Food",
            "soup": "Food", "rice": "Food", "beans": "Food", "yam": "Food",
            "grocer": "Food", "market": "Food", "food": "Food", "egg": "Food",
            "milk": "Food", "milo": "Food", "snack": "Food", "frozen": "Food",
            "toothpaste": "Toiletries", "detergent": "Toiletries", "hypo": "Toiletries",
            "transport": "Transport", "uber": "Transport", "bolt": "Transport", "fuel": "Transport",
            "data": "Utilities", "airtime": "Utilities", "internet": "Utilities", "phone": "Utilities",
            "rent": "Housing", "house": "Housing",
            "netflix": "Entertainment", "movie": "Entertainment",
        };

        for (const [key, category] of Object.entries(rules)) {
            if (lowerName.includes(key)) {
                // Check if this rule maps to an existing category
                const existing = suggestedCategories.find(c => c.name === category);
                return existing ? existing.name : category;
            }
        }
        return "";
    };

    const parseBulkText = () => {
        const lines = bulkText.split('\n').filter(line => line.trim());
        const items: BulkItem[] = lines.map((line, index) => {
            // Regex to match: (Item Name) (Amount)
            const match = line.match(/^(.+?)\s+([\d,.]+)\s*$/);

            if (match) {
                const name = match[1].trim();
                return {
                    id: `item-${index}`,
                    sourceName: name,
                    category: autoCategorize(name),
                    amount: match[2].replace(/,/g, '')
                };
            }
            // Fallback for lines that don't match perfectly
            return {
                id: `item-${index}`,
                sourceName: line.trim(),
                category: autoCategorize(line.trim()),
                amount: "0"
            };
        });
        setBulkItems(items);
        setIsPreviewing(true);
    };

    const updateBulkItem = (id: string, field: 'category' | 'amount' | 'sourceName', value: string) => {
        setBulkItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeBulkItem = (id: string) => {
        setBulkItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const selectedDate = new Date(month + "-01"); // First day of selected month

            if (inputMode === "single") {
                if (!category || !limit) return;

                const budgetData = {
                    user_id: user.id,
                    name: name || category, // Use category as name if name is empty
                    category,
                    amount_limit: parseFloat(limit),
                    period: "monthly",
                    month: selectedDate.toISOString()
                };

                if (operationMode === "edit" && initialData?.id) {
                    const { error } = await supabase
                        .from("budgets")
                        .update(budgetData)
                        .eq("id", initialData.id);
                    if (error) throw error;
                } else {
                    // Create or Duplicate (Duplicate is just a new insert)
                    const { error } = await supabase
                        .from("budgets")
                        .insert(budgetData);
                    if (error) throw error;
                }
            } else {
                // Bulk is always Create
                if (bulkItems.length === 0) return;
                const budgets = bulkItems.map(item => ({
                    user_id: user.id,
                    name: item.sourceName,
                    category: item.category,
                    amount_limit: parseFloat(item.amount),
                    period: "monthly",
                    month: selectedDate.toISOString()
                }));

                const { error } = await supabase.from("budgets").insert(budgets);
                if (error) throw error;
            }

            onClose();
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error("Error saving budget:", error);
            alert("Failed to save budget");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {operationMode === "edit" ? "Edit Budget" :
                            operationMode === "duplicate" ? "Duplicate Budget" : "Create Budget"}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mode Toggle - Only show for Create mode */}
                {operationMode === "create" && (
                    <div className="flex p-1 mb-6 bg-zinc-950 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setInputMode("single")}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                                inputMode === "single" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            Single Item
                        </button>
                        <button
                            onClick={() => setInputMode("bulk")}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                                inputMode === "bulk" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            Bulk Add
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Month Selection - Common for both */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Budget Month</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {inputMode === "single" ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Budget Name (Optional)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. Flight Tickets"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none appearance-none"
                                >
                                    <option value="">Select a category</option>
                                    {suggestedCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name} ({cat.group})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Limit</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500">₦</span>
                                    <input
                                        type="number"
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-4 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {!isPreviewing ? (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                                        Paste Items (Name Amount)
                                    </label>
                                    <textarea
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                        className="w-full h-48 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none resize-none font-mono text-sm"
                                        placeholder={`Pepper 40,000\nOnions 10,000\nTransport 5,000`}
                                    />
                                    <p className="text-xs text-zinc-500 mt-2">
                                        Paste your list. Each line should have a name and an amount.
                                    </p>
                                    <button
                                        onClick={parseBulkText}
                                        disabled={!bulkText.trim()}
                                        className="w-full mt-4 rounded-lg bg-zinc-800 py-2 font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
                                    >
                                        Preview & Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">{bulkItems.length} items found</span>
                                        <button
                                            onClick={() => setIsPreviewing(false)}
                                            className="text-xs text-emerald-500 hover:text-emerald-400"
                                        >
                                            Edit Raw Text
                                        </button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                        {bulkItems.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                                                <div className="w-1/3 text-xs text-zinc-500 truncate" title={item.sourceName}>
                                                    {item.sourceName}
                                                </div>
                                                <select
                                                    value={item.category}
                                                    onChange={(e) => updateBulkItem(item.id, 'category', e.target.value)}
                                                    className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-transparent focus:border-zinc-700 appearance-none"
                                                >
                                                    <option value="" className="bg-zinc-900">Select Category</option>
                                                    {suggestedCategories.map(cat => (
                                                        <option key={cat.id} value={cat.name} className="bg-zinc-900">
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="relative w-24">
                                                    <span className="absolute left-1 top-1 text-zinc-500 text-xs">₦</span>
                                                    <input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) => updateBulkItem(item.id, 'amount', e.target.value)}
                                                        className="w-full bg-transparent text-sm text-right text-white focus:outline-none border-b border-transparent focus:border-zinc-700 pl-4"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeBulkItem(item.id)}
                                                    className="text-zinc-500 hover:text-rose-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {(inputMode === "single" || isPreviewing) && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (inputMode === "single" ? (!category || !limit) : bulkItems.length === 0)}
                            className="w-full flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors mt-4 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (inputMode === "single" ? "Create Budget" : `Create ${bulkItems.length} Budgets`)}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
