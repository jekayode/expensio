"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Folder, ArrowRight, Loader2 } from "lucide-react";
import { AddProjectModal } from "@/components/projects/AddProjectModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    total_spent?: number;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();

    const fetchProjects = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (projectsError) throw projectsError;

            // Fetch expenses to calculate total spent per project
            // Note: In a production app, this might be better as a database view or RPC
            const { data: expensesData, error: expensesError } = await supabase
                .from("project_expenses")
                .select("project_id, amount")
                .eq("user_id", user.id);

            if (expensesError && expensesError.code !== 'PGRST116') { // Ignore if table doesn't exist yet
                console.warn("Error fetching expenses:", expensesError);
            }

            const expensesByProject: Record<string, number> = {};
            expensesData?.forEach((exp: any) => {
                expensesByProject[exp.project_id] = (expensesByProject[exp.project_id] || 0) + exp.amount;
            });

            const processedProjects = projectsData.map(p => ({
                ...p,
                total_spent: expensesByProject[p.id] || 0
            }));

            setProjects(processedProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            fetchProjects();
        }

        const channel = supabase
            .channel('projects_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_expenses' }, fetchProjects)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, authLoading, fetchProjects]);

    const totalSpentAllProjects = projects.reduce((sum, p) => sum + (p.total_spent || 0), 0);

    if (authLoading) return <div className="p-8 text-center text-zinc-500">Loading auth...</div>;
    if (!user) return <div className="p-8 text-center text-zinc-500">Please log in to view projects.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">Total Project Spending</p>
                <p className="text-3xl font-bold text-white mt-2">₦{totalSpentAllProjects.toLocaleString()}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    No projects created yet. Click &quot;Create Project&quot; to start tracking.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="group block rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-emerald-500/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                                        <Folder className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white group-hover:text-emerald-500 transition-colors">{project.name}</h3>
                                        <p className="text-xs text-zinc-500 capitalize">{project.status}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                            </div>

                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10">
                                {project.description || "No description"}
                            </p>

                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-500">Total Spent</p>
                                <p className="text-xl font-bold text-white">₦{(project.total_spent || 0).toLocaleString()}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
