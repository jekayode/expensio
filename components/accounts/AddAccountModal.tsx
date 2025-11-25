"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        id: string;
        name: string;
        type: string;
        balance: number;
    } | null;
    mode?: "create" | "edit";
    onSuccess?: () => void;
}

const ACCOUNT_TYPES = ["Savings", "Current", "Investment"];

export function AddAccountModal({ isOpen, onClose, initialData, mode = "create", onSuccess }: AddAccountModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState(ACCOUNT_TYPES[0]);
    const [balance, setBalance] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    // Reset or pre-fill form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && initialData) {
                setName(initialData.name);
                // Capitalize first letter for the select match
                const capitalizedType = initialData.type.charAt(0).toUpperCase() + initialData.type.slice(1);
                setType(capitalizedType);
                setBalance(initialData.balance.toString());
            } else {
                setName("");
                setType(ACCOUNT_TYPES[0]);
                setBalance("");
            }
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name || !type || !balance || !user) return;
        setIsSubmitting(true);

        try {
            const accountData = {
                user_id: user.id,
                name,
                type: type.toLowerCase(),
                balance: parseFloat(balance),
            };

            if (mode === "edit" && initialData?.id) {
                const { error } = await supabase
                    .from("accounts")
                    .update(accountData)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("accounts")
                    .insert(accountData);
                if (error) throw error;
            }

            onClose();
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error("Error saving account:", error);
            alert("Failed to save account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {mode === "edit" ? "Edit Account" : "Add Account"}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Account Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Main Savings"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Account Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none appearance-none"
                        >
                            {ACCOUNT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Current Balance</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-zinc-500">₦</span>
                            <input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-4 text-white focus:border-emerald-500 focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name || !balance}
                        className="w-full flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors mt-4 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === "edit" ? "Save Changes" : "Add Account")}
                    </button>
                </div>
            </div>
        </div>
    );
}
