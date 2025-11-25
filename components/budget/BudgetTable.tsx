import { MoreHorizontal, Pencil, Trash2, Copy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

import { Budget as BaseBudget } from "@/types";

interface Budget extends BaseBudget {
    spent: number;
    color: string;
}

interface BudgetTableProps {
    budgets: Budget[];
    onEdit: (budget: Budget) => void;
    onDelete: (id: string) => void;
    onDuplicate: (budget: Budget) => void;
}

export function BudgetTable({ budgets, onEdit, onDelete, onDuplicate }: BudgetTableProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

    // Local state for table features
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Budget | 'spent' | 'progress'; direction: 'asc' | 'desc' } | null>(null);

    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, itemsPerPage]);

    // Get unique categories for filter
    const categories = ["All", ...Array.from(new Set(budgets.map(b => b.category))).sort()];

    // Filter and Sort Logic
    const filteredBudgets = budgets.filter(budget => {
        const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "All" || budget.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedBudgets = [...filteredBudgets].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: any = a[sortConfig.key as keyof Budget];
        let bValue: any = b[sortConfig.key as keyof Budget];

        // Handle special cases
        if (sortConfig.key === 'progress') {
            aValue = (a.spent / a.amount_limit);
            bValue = (b.spent / b.amount_limit);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedBudgets.length / itemsPerPage);
    const paginatedBudgets = sortedBudgets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: keyof Budget | 'spent' | 'progress') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleMenu = (id: string, event: React.MouseEvent) => {
        if (openMenuId === id) {
            setOpenMenuId(null);
            setMenuPosition(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 5,
                right: window.innerWidth - rect.right
            });
            setOpenMenuId(id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2 flex-1">
                    <input
                        type="text"
                        placeholder="Search budgets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950 text-zinc-400">
                            <tr>
                                <th
                                    className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                                    onClick={() => handleSort('name')}
                                >
                                    Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                                    onClick={() => handleSort('category')}
                                >
                                    Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-4 font-medium text-right cursor-pointer hover:text-white"
                                    onClick={() => handleSort('spent')}
                                >
                                    Spent {sortConfig?.key === 'spent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-4 font-medium text-right cursor-pointer hover:text-white"
                                    onClick={() => handleSort('amount_limit')}
                                >
                                    Limit {sortConfig?.key === 'amount_limit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                                    onClick={() => handleSort('progress')}
                                >
                                    Status {sortConfig?.key === 'progress' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {paginatedBudgets.map((budget) => {
                                const progress = (budget.spent / budget.amount_limit) * 100;
                                const isOverBudget = progress > 100;

                                return (
                                    <tr key={budget.id} className="group hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {budget.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                                                <div className={cn("mr-1.5 h-2 w-2 rounded-full", budget.color)} />
                                                {budget.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-white">
                                            ₦{budget.spent.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-400">
                                            ₦{budget.amount_limit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full", isOverBudget ? "bg-rose-500" : "bg-emerald-500")}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={cn("text-xs font-medium", isOverBudget ? "text-rose-500" : "text-emerald-500")}>
                                                    {Math.round(progress)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => toggleMenu(budget.id, e)}
                                                className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            {openMenuId === budget.id && menuPosition && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => { setOpenMenuId(null); setMenuPosition(null); }}
                                                    />
                                                    <div
                                                        className="fixed z-50 w-48 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1"
                                                        style={{
                                                            top: menuPosition.top,
                                                            right: menuPosition.right
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => { onEdit(budget); setOpenMenuId(null); setMenuPosition(null); }}
                                                            className="flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => { onDuplicate(budget); setOpenMenuId(null); setMenuPosition(null); }}
                                                            className="flex w-full items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Duplicate
                                                        </button>
                                                        <button
                                                            onClick={() => { onDelete(budget.id); setOpenMenuId(null); setMenuPosition(null); }}
                                                            className="flex w-full items-center px-4 py-2 text-sm text-rose-500 hover:bg-zinc-800 hover:text-rose-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedBudgets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        No budgets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-zinc-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBudgets.length)} of {filteredBudgets.length} results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-lg border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
