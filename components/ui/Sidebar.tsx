"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, PieChart, Settings, Wallet, Folder, Receipt, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: CreditCard },
    { name: "Budget", href: "/budget", icon: PieChart },
    { name: "Accounts", href: "/accounts", icon: Wallet },
    { name: "Projects", href: "/projects", icon: Folder },
    { name: "Receipts", href: "/receipts", icon: Receipt },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (pathname === "/login") return null;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 rounded-md bg-zinc-900 p-2 text-zinc-400 hover:text-white md:hidden"
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-zinc-900 text-white border-r border-zinc-800 transition-transform duration-300 md:static md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
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
                                onClick={() => setIsMobileMenuOpen(false)}
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
                <div className="p-4 border-t border-zinc-800 space-y-2">
                    <Link
                        href="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            pathname === "/settings"
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        )}
                    >
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-rose-500 rounded-md hover:bg-zinc-800 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
