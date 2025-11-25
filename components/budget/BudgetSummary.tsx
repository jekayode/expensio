import { cn } from "@/lib/utils";

interface CategorySummary {
    category: string;
    limit: number;
    spent: number;
    color: string;
}

interface BudgetSummaryProps {
    summaries: CategorySummary[];
}

export function BudgetSummary({ summaries }: BudgetSummaryProps) {
    const totalLimit = summaries.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = summaries.reduce((acc, curr) => acc + curr.spent, 0);
    const totalProgress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Summary Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-medium text-zinc-400">Total Budget</h3>
                    <div className="mt-2 flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-white">
                            ₦{totalSpent.toLocaleString()}
                        </span>
                        <span className="text-sm text-zinc-500">
                            / ₦{totalLimit.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-zinc-800">
                        <div
                            className={cn("h-2 rounded-full transition-all",
                                totalProgress > 100 ? "bg-rose-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(totalProgress, 100)}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 text-right">{Math.round(totalProgress)}%</p>
                </div>
            </div>

            {/* Category Cards */}
            {summaries.map((summary) => {
                const progress = summary.limit > 0 ? (summary.spent / summary.limit) * 100 : 0;
                const isOver = progress > 100;

                return (
                    <div key={summary.category} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col justify-between">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className={cn("h-2 w-2 rounded-full", summary.color)} />
                            <h3 className="text-sm font-medium text-white truncate">{summary.category}</h3>
                        </div>
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-lg font-bold text-white">
                                    ₦{summary.spent.toLocaleString()}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    / ₦{summary.limit.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-3">
                                <div className="h-1.5 w-full rounded-full bg-zinc-800">
                                    <div
                                        className={cn("h-1.5 rounded-full transition-all",
                                            isOver ? "bg-rose-500" : summary.color.replace("bg-", "bg-") // Keep original color or use generic
                                        )}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
