"use client";

import { ArrowUpRight, ArrowDownRight, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

export function AccountSummary() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch Total Balance (Sum of all accounts)
                const { data: accounts, error: accountsError } = await supabase
                    .from('accounts')
                    .select('balance')
                    .eq('user_id', user.id);

                if (accountsError) throw accountsError;

                const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

                // Fetch Monthly Income and Expenses
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

                const { data: transactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('amount, type')
                    .eq('user_id', user.id)
                    .gte('date', startOfMonth)
                    .lte('date', endOfMonth);

                if (transactionsError) throw transactionsError;

                const monthlyIncome = transactions
                    ?.filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0) || 0;

                const monthlyExpenses = transactions
                    ?.filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

                setStats({
                    totalBalance,
                    monthlyIncome,
                    monthlyExpenses,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Realtime subscription for updates
        const accountsChannel = supabase
            .channel('dashboard_accounts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, fetchData)
            .subscribe();

        const transactionsChannel = supabase
            .channel('dashboard_transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(accountsChannel);
            supabase.removeChannel(transactionsChannel);
        };
    }, [user]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-[116px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card
                title="Total Balance"
                amount={`₦${stats.totalBalance.toLocaleString()}`}
                icon={DollarSign}
                trend="+0%" // Placeholder for now, requires historical data
                trendUp={true}
                className="bg-zinc-900 border-zinc-800"
            />
            <Card
                title="Monthly Income"
                amount={`₦${stats.monthlyIncome.toLocaleString()}`}
                icon={ArrowUpRight}
                trend="This Month"
                trendUp={true}
                className="bg-zinc-900 border-zinc-800"
                iconColor="text-emerald-500"
            />
            <Card
                title="Monthly Expenses"
                amount={`₦${stats.monthlyExpenses.toLocaleString()}`}
                icon={ArrowDownRight}
                trend="This Month"
                trendUp={false}
                className="bg-zinc-900 border-zinc-800"
                iconColor="text-rose-500"
            />
        </div>
    );
}

function Card({
    title,
    amount,
    icon: Icon,
    trend,
    trendUp,
    className,
    iconColor = "text-zinc-100",
}: {
    title: string;
    amount: string;
    icon: any;
    trend: string;
    trendUp: boolean;
    className?: string;
    iconColor?: string;
}) {
    return (
        <div className={cn("rounded-xl border p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-zinc-400">{title}</h3>
                <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">{amount}</div>
                <div
                    className={cn(
                        "text-xs font-medium",
                        trendUp ? "text-emerald-500" : "text-rose-500"
                    )}
                >
                    {trend}
                </div>
            </div>
        </div>
    );
}
