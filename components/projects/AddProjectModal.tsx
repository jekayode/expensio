"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name || !user) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("projects").insert({
                user_id: user.id,
                name,
                description,
                status: "active",
            });

            if (error) throw error;

            onClose();
            setName("");
            setDescription("");
            router.refresh();
        } catch (error) {
            console.error("Error adding project:", error);
            alert("Failed to add project");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Create Project</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Building Project"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-4 text-white focus:border-emerald-500 focus:outline-none h-24 resize-none"
                            placeholder="Project details..."
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name}
                        className="w-full flex justify-center items-center rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 transition-colors mt-4 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Project"}
                    </button>
                </div>
            </div>
        </div>
    );
}
