"use client";

export const runtime = 'edge';

import { useState, useEffect, useCallback, use } from "react";
import { ArrowLeft, Plus, Calendar, Tag, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { AddProjectExpenseModal } from "@/components/projects/AddProjectExpenseModal";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
}

interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id: projectId } = use(params);

    const [project, setProject] = useState<Project | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user || !projectId) return;
        try {
            // Fetch project details
            const { data: projectData, error: projectError } = await supabase
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (projectError) throw projectError;
            setProject(projectData);

            // Fetch project expenses
            const { data: expensesData, error: expensesError } = await supabase
                .from("project_expenses")
                .select("*")
                .eq("project_id", projectId)
                .order("date", { ascending: false });

            if (expensesError && expensesError.code !== 'PGRST116') {
                console.warn("Error fetching expenses:", expensesError);
            }
            setExpenses(expensesData || []);

        } catch (error) {
            console.error("Error fetching project details:", error);
        } finally {
            setLoading(false);
        }
    }, [user, projectId]);

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }

        const channel = supabase
            .channel(`project_${projectId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_expenses', filter: `project_id=eq.${projectId}` }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, authLoading, fetchData, projectId]);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    if (authLoading || loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!project) return <div className="p-8 text-center text-zinc-500">Project not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/projects" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <p className="text-sm text-zinc-400">{project.status}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Expenses</h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense
                            </button>
                        </div>

                        {expenses.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">
                                No expenses recorded for this project yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expenses.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                                        <div className="space-y-1">
                                            <p className="font-medium text-white">{expense.description}</p>
                                            <div className="flex items-center space-x-3 text-xs text-zinc-500">
                                                <span className="flex items-center">
                                                    <Tag className="mr-1 h-3 w-3" />
                                                    {expense.category}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="font-bold text-white">₦{expense.amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <p className="text-sm text-zinc-400">Total Project Cost</p>
                        <p className="text-3xl font-bold text-white mt-2">₦{totalSpent.toLocaleString()}</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h3 className="font-medium text-white mb-4">Expenses by Category</h3>
                        <div className="space-y-3">
                            {Object.entries(expensesByCategory).map(([category, amount]) => (
                                <div key={category} className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">{category}</span>
                                    <span className="font-medium text-white">₦{amount.toLocaleString()}</span>
                                </div>
                            ))}
                            {Object.keys(expensesByCategory).length === 0 && (
                                <p className="text-zinc-500 text-sm">No expenses yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h3 className="font-medium text-white mb-4">Description</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {project.description || "No description provided."}
                        </p>
                    </div>
                </div>
            </div>

            <AddProjectExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectId={projectId}
            />
        </div>
    );
}
