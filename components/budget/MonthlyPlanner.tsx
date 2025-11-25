"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { MonthlyPlan, Budget, Category } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

interface MonthlyPlannerProps {
    month: string; // YYYY-MM
    onUpdate?: () => void;
}

export function MonthlyPlanner({ month, onUpdate }: MonthlyPlannerProps) {
    const [plan, setPlan] = useState<MonthlyPlan | null>(null);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [income, setIncome] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        // Fetch Monthly Plan
        const { data: planData } = await supabase
            .from("monthly_plans")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", `${month}-01`)
            .single();

        if (planData) {
            setPlan(planData);
            setIncome(planData.expected_income.toString());
        } else {
            setPlan(null);
            setIncome("");
        }

        // Fetch Budgets for the month
        const { data: budgetData } = await supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", `${month}-01`);

        setBudgets(budgetData || []);

        // Fetch Categories to map budgets to groups
        const { data: categoryData } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id);

        setCategories(categoryData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [month, user]);

    const handleSaveIncome = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const incomeValue = parseFloat(income) || 0;
            const date = `${month}-01`;

            if (plan) {
                const { error } = await supabase
                    .from("monthly_plans")
                    .update({ expected_income: incomeValue })
                    .eq("id", plan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("monthly_plans")
                    .insert({
                        user_id: user.id,
                        month: date,
                        expected_income: incomeValue
                    });
                if (error) throw error;
            }
            fetchData();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error saving income:", error);
            alert("Failed to save income");
        } finally {
            setSaving(false);
        }
    };

    const getGroupTotal = (group: 'needs' | 'wants' | 'savings') => {
        return budgets
            .filter(b => {
                const cat = categories.find(c => c.name === b.category);
                return cat?.group === group;
            })
            .reduce((sum, b) => sum + b.amount_limit, 0);
    };

    const incomeVal = parseFloat(income) || 0;
    const needsTotal = getGroupTotal('needs');
    const wantsTotal = getGroupTotal('wants');
    const savingsTotal = getGroupTotal('savings');

    const needsTarget = incomeVal * 0.5;
    const wantsTarget = incomeVal * 0.3;
    const savingsTarget = incomeVal * 0.2;

    const renderCard = (title: string, current: number, target: number, color: string) => {
        const percentage = target > 0 ? (current / target) * 100 : 0;
        const isOver = current > target;

        return (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
                        <div className="text-2xl font-bold text-white mt-1">
                            ₦{current.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">Target</div>
                        <div className="text-sm font-medium text-zinc-300">
                            ₦{target.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                    <div
                        className={cn("h-2 rounded-full transition-all", color)}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between text-xs">
                    <span className={cn(
                        isOver ? "text-rose-400" : "text-zinc-500"
                    )}>
                        {isOver ? `Over by ₦${(current - target).toLocaleString()}` : `${(100 - percentage).toFixed(0)}% remaining`}
                    </span>
                    <span className="text-zinc-500">
                        {title === "Needs" ? "50%" : title === "Wants" ? "30%" : "20%"}
                    </span>
                </div>
            </div>
        );
    };

    if (loading) return <div className="animate-pulse h-32 bg-zinc-900 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Expected Monthly Income</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-zinc-500">₦</span>
                        <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-4 text-white focus:border-emerald-500 focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        onClick={handleSaveIncome}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderCard("Needs", needsTotal, needsTarget, "bg-blue-500")}
                {renderCard("Wants", wantsTotal, wantsTarget, "bg-purple-500")}
                {renderCard("Savings", savingsTotal, savingsTarget, "bg-emerald-500")}
            </div>
        </div>
    );
}
