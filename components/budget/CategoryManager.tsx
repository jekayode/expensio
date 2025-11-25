"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function CategoryManager({ isOpen, onClose, onUpdate }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryGroup, setNewCategoryGroup] = useState<'needs' | 'wants' | 'savings'>('needs');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchCategories = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id)
            .order("name");

        if (error) {
            console.error("Error fetching categories:", error);
        } else {
            setCategories(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newCategoryName.trim()) return;

        setIsSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase
                    .from("categories")
                    .update({ name: newCategoryName, group: newCategoryGroup })
                    .eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("categories")
                    .insert({
                        user_id: user.id,
                        name: newCategoryName,
                        group: newCategoryGroup
                    });
                if (error) throw error;
            }

            setNewCategoryName("");
            setNewCategoryGroup("needs");
            setEditingId(null);
            fetchCategories();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Failed to save category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchCategories();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        }
    };

    const startEdit = (category: Category) => {
        setNewCategoryName(category.name);
        setNewCategoryGroup(category.group);
        setEditingId(category.id);
    };

    const cancelEdit = () => {
        setNewCategoryName("");
        setNewCategoryGroup("needs");
        setEditingId(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Manage Categories</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Category Name</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Groceries"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Group (50/30/20)</label>
                        <div className="flex gap-2">
                            {(['needs', 'wants', 'savings'] as const).map((group) => (
                                <button
                                    key={group}
                                    type="button"
                                    onClick={() => setNewCategoryGroup(group)}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize",
                                        newCategoryGroup === group
                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !newCategoryName.trim()}
                            className="flex-1 flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingId ? "Update Category" : "Add Category")}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
                    {loading ? (
                        <div className="text-center text-zinc-500 py-4">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-center text-zinc-500 py-4">No categories found. Add one above.</div>
                    ) : (
                        categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                <div>
                                    <div className="font-medium text-white">{category.name}</div>
                                    <div className={cn(
                                        "text-xs capitalize",
                                        category.group === 'needs' ? "text-blue-400" :
                                            category.group === 'wants' ? "text-purple-400" : "text-emerald-400"
                                    )}>
                                        {category.group}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEdit(category)}
                                        className="p-1 text-zinc-500 hover:text-white"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-1 text-zinc-500 hover:text-rose-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
