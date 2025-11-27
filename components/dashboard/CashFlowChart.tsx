"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from "lucide-react";

export function CashFlowChart() {
    const { user } = useAuth();
    const [data, setData] = useState<{ name: string; income: number; expenses: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch transactions for the last 6 months
                const now = new Date();
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

                const { data: transactions, error } = await supabase
                    .from('transactions')
                    .select('amount, type, date')
                    .eq('user_id', user.id)
                    .gte('date', sixMonthsAgo)
                    .order('date', { ascending: true });

                if (error) throw error;

                // Process data
                const monthlyData: Record<string, { income: number; expenses: number }> = {};

                // Initialize last 6 months
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthName = d.toLocaleString('default', { month: 'short' });
                    monthlyData[monthName] = { income: 0, expenses: 0 };
                }

                transactions?.forEach(t => {
                    const date = new Date(t.date);
                    const monthName = date.toLocaleString('default', { month: 'short' });

                    if (monthlyData[monthName]) {
                        if (t.type === 'income') {
                            monthlyData[monthName].income += t.amount;
                        } else {
                            monthlyData[monthName].expenses += Math.abs(t.amount);
                        }
                    }
                });

                const chartData = Object.entries(monthlyData).map(([name, values]) => ({
                    name,
                    income: values.income,
                    expenses: values.expenses
                }));

                setData(chartData);
            } catch (error) {
                console.error("Error fetching chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const channel = supabase
            .channel('chart_transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    if (loading) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-[380px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-medium text-white">Cash Flow</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₦${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                            itemStyle={{ color: "#fff" }}
                            cursor={{ fill: "#27272a" }}
                            formatter={(value: number) => [`₦${value.toLocaleString()}`, undefined]}
                        />
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                        <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
