import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountSummary() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card
                title="Total Balance"
                amount="₦12,345.00"
                icon={DollarSign}
                trend="+2.5%"
                trendUp={true}
                className="bg-zinc-900 border-zinc-800"
            />
            <Card
                title="Monthly Income"
                amount="₦4,500.00"
                icon={ArrowUpRight}
                trend="+12%"
                trendUp={true}
                className="bg-zinc-900 border-zinc-800"
                iconColor="text-emerald-500"
            />
            <Card
                title="Monthly Expenses"
                amount="₦2,150.00"
                icon={ArrowDownRight}
                trend="-5%"
                trendUp={true} // Expenses going down is good, so green? Or just visual? Let's say green for good.
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
                    {trend} from last month
                </div>
            </div>
        </div>
    );
}
