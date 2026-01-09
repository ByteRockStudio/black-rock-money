"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";

interface BudgetCategory {
    id: string;
    name: string;
    budgetLimit: number;
    spent: number;
    percentage: number;
    isOverBudget: boolean;
}

interface BudgetData {
    categories: BudgetCategory[];
    totalBudget: number;
    totalSpent: number;
    daysLeftInMonth: number;
}

export default function BudgetPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useCloseOnEscape(() => router.push('/'));

    const [data, setData] = useState<BudgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchBudgetData();
        }
    }, [session]);

    const fetchBudgetData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/budget");
            if (res.ok) {
                const budgetData = await res.json();
                setData(budgetData);
            } else {
                toast.error("Failed to load budget data");
            }
        } catch (error) {
            console.error("Failed to fetch budget data", error);
            toast.error("Failed to load budget data");
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (id: string, currentLimit: number) => {
        setEditingId(id);
        setEditValue(currentLimit.toString());
    };

    const handleSaveLimit = async () => {
        if (!editingId || !editValue) return;

        try {
            const res = await fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingId,
                    budgetLimit: parseFloat(editValue),
                }),
            });

            if (res.ok) {
                toast.success("Budget limit updated");
                fetchBudgetData();
            } else {
                toast.error("Failed to update budget limit");
            }
        } catch (error) {
            toast.error("Error updating budget limit");
        }

        setEditingId(null);
        setEditValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSaveLimit();
        } else if (e.key === "Escape") {
            setEditingId(null);
            setEditValue("");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="text-zinc-400">Loading...</span>
            </div>
        );
    }

    if (!session || !data) return null;

    const totalPercentage = data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0;
    const safeToSpend = Math.max(0, data.totalBudget - data.totalSpent);

    // Calculate burn rate insight
    const now = new Date();
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedPercentage = (currentDay / lastDayOfMonth) * 100;
    const actualPercentage = totalPercentage;
    const isSpendingFast = actualPercentage > expectedPercentage + 10;
    const isSpendingSlow = actualPercentage < expectedPercentage - 10;

    return (
        <div className="flex h-full w-full overflow-hidden divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left Panel (75%) - Budget List */}
            <div className="w-[75%] h-full flex flex-col px-6 relative">
                {/* Header - Compact */}
                <div className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 py-4 bg-white dark:bg-[#171717]">
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            href="/"
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                            Budget Overview
                        </h1>
                    </div>

                    {/* Column Headers - Compact */}
                    <div className="grid grid-cols-[2fr_3fr_1.5fr_60px] gap-3 items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3">
                        <div className="text-left">Category</div>
                        <div className="text-left">Progress</div>
                        <div className="text-right">Spent / Limit</div>
                        <div className="text-right"></div>
                    </div>
                </div>

                {/* List Content - Compact Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    {data.categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-sm">
                            <p>No budgets set yet.</p>
                            <p className="text-xs mt-1">Add limits in Settings → Categories</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {data.categories.map((category) => {
                                const remaining = Math.max(0, category.budgetLimit - category.spent);
                                const dailyCap = data.daysLeftInMonth > 0 ? remaining / data.daysLeftInMonth : 0;

                                return (
                                    <div
                                        key={category.id}
                                        className="grid grid-cols-[2fr_3fr_1.5fr_60px] gap-3 items-center w-full border-b border-zinc-100 dark:border-zinc-800 py-2.5 px-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition group"
                                    >
                                        {/* Category Name - Compact */}
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                            {category.name}
                                        </div>

                                        {/* Progress Bar - Slim */}
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                {category.isOverBudget ? (
                                                    <div className="flex gap-0.5 flex-1">
                                                        <div className="relative h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex-1">
                                                            <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: "100%" }} />
                                                        </div>
                                                        <div
                                                            className="relative h-1.5 bg-red-200 dark:bg-red-500/20 rounded-full overflow-hidden"
                                                            style={{ width: `${Math.min(category.percentage - 100, 100)}%` }}
                                                        >
                                                            <div className="h-full bg-red-500" style={{ width: "100%" }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex-1">
                                                        <div
                                                            className="h-full bg-zinc-900 dark:bg-white"
                                                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <span className={`text-[10px] font-medium min-w-[36px] text-right ${category.isOverBudget ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                                                    {category.percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            {/* Daily Cap - Micro text */}
                                            <div className="text-[11px] text-right">
                                                {category.isOverBudget ? (
                                                    <span className="text-red-400">Over limit</span>
                                                ) : (
                                                    <span className="text-zinc-400">
                                                        <span className="text-zinc-700 dark:text-zinc-300">{dailyCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}₴</span>/day
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Spent / Limit - Compact */}
                                        <div className="text-right text-sm">
                                            <span className={category.isOverBudget ? "text-red-500 font-medium" : "text-zinc-900 dark:text-white"}>
                                                {category.spent.toLocaleString()}
                                            </span>
                                            <span className="text-zinc-400 text-xs"> / </span>
                                            {editingId === category.id ? (
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleSaveLimit}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-16 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm focus:border-zinc-900 dark:focus:border-white focus:outline-none text-right"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition text-xs"
                                                    onClick={() => handleStartEdit(category.id, category.budgetLimit)}
                                                >
                                                    {category.budgetLimit.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Edit Button - Compact */}
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleStartEdit(category.id, category.budgetLimit)}
                                                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel (25%) - Compact Summary */}
            <div className="w-[25%] h-full bg-zinc-50/80 dark:bg-[#111111]/50 p-5 overflow-y-auto">
                <div className="w-full">
                    {/* Month Overview Card - Compact */}
                    <div className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-sm space-y-4">
                        {/* Header Row */}
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                Overview
                            </p>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${totalPercentage > 100 ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                                totalPercentage > 80 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400" :
                                    "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                                }`}>
                                {totalPercentage.toFixed(0)}%
                            </div>
                        </div>

                        {/* Hero - Compact */}
                        <div className="py-2">
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Safe to Spend</p>
                            <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                {safeToSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-sm font-medium text-zinc-400 ml-1">₴</span>
                            </p>
                        </div>

                        {/* Progress Bar - Compact */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                                <span>{data.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span>{data.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="relative h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${totalPercentage > 100 ? "bg-red-500" : "bg-zinc-900 dark:bg-white"}`}
                                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Alert Box - Compact */}
                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-md p-2.5">
                                {isSpendingFast ? (
                                    <p className="text-xs text-orange-600 dark:text-orange-400">
                                        ⚠️ Pacing fast
                                    </p>
                                ) : isSpendingSlow ? (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        ✓ Under pace
                                    </p>
                                ) : (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        → On track
                                    </p>
                                )}
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    {data.daysLeftInMonth}d left
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
