"use client";

import { useState, useEffect } from "react";
import { Plus, Settings, Calendar } from "lucide-react";
import { CreateBudgetModal } from "@/components/budget/CreateBudgetModal";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { MonthlyPlanner } from "@/components/budget/MonthlyPlanner";
import { BudgetTable } from "@/components/budget/BudgetTable";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Budget, Category } from "@/types";

interface BudgetWithStats extends Budget {
    spent: number;
    color: string;
}

export default function BudgetPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [budgets, setBudgets] = useState<BudgetWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "duplicate">("create");
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const { user } = useAuth();

    const fetchBudgets = async () => {
        if (!user) return;
        setLoading(true);

        // 1. Fetch Budgets
        const { data: budgetData, error: budgetError } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", `${selectedMonth}-01`)
            .order("category");

        if (budgetError) {
            console.error("Error fetching budgets:", budgetError);
            setLoading(false);
            return;
        }

        // 2. Fetch Categories (to get groups for colors)
        const { data: categoryData } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id);

        const categoryMap = new Map<string, Category>();
        categoryData?.forEach(c => categoryMap.set(c.name, c));

        // 3. Fetch Transactions for the month to calculate spent
        // We need to filter by month.
        const startOfMonth = `${selectedMonth}-01`;
        // Calculate end of month
        const date = new Date(startOfMonth);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { data: txData } = await supabase
            .from("transactions")
            .select("amount, category, type, description")
            .eq("user_id", user.id)
            .gte("date", startOfMonth)
            .lte("date", endOfMonth);

        // 4. Calculate stats
        const budgetsWithStats = (budgetData || []).map(budget => {
            const spent = txData
                ?.filter(tx =>
                    tx.category === budget.category &&
                    tx.type === 'expense' &&
                    tx.description?.toLowerCase().includes(budget.name.toLowerCase())
                )
                .reduce((sum, tx) => sum + tx.amount, 0) || 0;

            const category = categoryMap.get(budget.category);
            let color = "bg-zinc-500";
            if (category) {
                if (category.group === 'needs') color = "bg-blue-500";
                else if (category.group === 'wants') color = "bg-purple-500";
                else if (category.group === 'savings') color = "bg-emerald-500";
            }

            return {
                ...budget,
                spent,
                color
            };
        });

        setBudgets(budgetsWithStats);
        setLoading(false);
    };

    useEffect(() => {
        fetchBudgets();
    }, [user, selectedMonth]);

    const handleCreate = () => {
        setSelectedBudget(null);
        setModalMode("create");
        setIsCreateModalOpen(true);
    };

    const handleEdit = (budget: Budget) => {
        setSelectedBudget(budget);
        setModalMode("edit");
        setIsCreateModalOpen(true);
    };

    const handleDuplicate = (budget: Budget) => {
        setSelectedBudget(budget);
        setModalMode("duplicate");
        setIsCreateModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this budget?")) return;

        const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting budget:", error);
            alert("Failed to delete budget");
        } else {
            fetchBudgets();
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Monthly Budget</h1>
                    <p className="text-zinc-400 text-sm">Plan your spending and track your progress</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                    <button
                        onClick={() => setIsCategoryManagerOpen(true)}
                        className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Categories
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Budget
                    </button>
                </div>
            </div>

            <MonthlyPlanner month={selectedMonth} onUpdate={fetchBudgets} />

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Budget Breakdown</h2>
                {loading ? (
                    <div className="text-center py-12 text-zinc-500">Loading budgets...</div>
                ) : (
                    <BudgetTable
                        budgets={budgets}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                    />
                )}
            </div>

            <CreateBudgetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchBudgets}
                initialData={selectedBudget}
                mode={modalMode}
            />

            <CategoryManager
                isOpen={isCategoryManagerOpen}
                onClose={() => setIsCategoryManagerOpen(false)}
                onUpdate={() => {
                    fetchBudgets();
                }}
            />
        </div>
    );
}
