"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, PieChart, Settings, Wallet, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: PieChart },
    { name: "Accounts", href: "/accounts", icon: Wallet },
    { name: "Projects", href: "/projects", icon: Folder },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-zinc-900 text-white border-r border-zinc-800">
            <div className="flex h-16 items-center px-6 border-b border-zinc-800">
                <Wallet className="h-6 w-6 text-emerald-500 mr-2" />
                <span className="text-xl font-bold tracking-tight">Expensie</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-emerald-500" : "text-zinc-400 group-hover:text-white"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-zinc-800">
                <button className="flex w-full items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                </button>
            </div>
        </div>
    );
}
