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

    useCloseOnEscape(() => router.back());

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
            <div className="flex h-screen items-center justify-center bg-[#efede7] dark:bg-black">
                <span className="text-gray-400">Loading...</span>
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
        <div className="flex h-screen w-full overflow-hidden bg-[#efede7] dark:bg-black font-sans">
            {/* Left Panel (75%) - Budget List */}
            <div className="w-[75%] h-full flex flex-col bg-white dark:bg-black px-8 relative">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link
                            href="/"
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Budget Overview
                        </h1>
                    </div>

                    {/* Column Headers */}
                    <div className="grid grid-cols-[2fr_3fr_1.5fr_80px] gap-4 items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4 px-4">
                        <div className="text-left">Category</div>
                        <div className="text-left">Progress</div>
                        <div className="text-right">Spent / Limit</div>
                        <div className="text-right">Actions</div>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                    {data.categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>No budgets set yet.</p>
                            <p className="text-sm mt-2">Add budget limits in Settings → Categories</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {data.categories.map((category) => {
                                // Calculate daily cap for this category
                                const remaining = Math.max(0, category.budgetLimit - category.spent);
                                const dailyCap = data.daysLeftInMonth > 0 ? remaining / data.daysLeftInMonth : 0;

                                return (
                                    <div
                                        key={category.id}
                                        className="grid grid-cols-[2fr_3fr_1.5fr_80px] gap-4 items-start w-full bg-white dark:bg-black border-b border-gray-50 dark:border-white/5 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition group"
                                    >
                                        {/* Category Name */}
                                        <div className="font-medium text-gray-900 dark:text-white truncate pt-1">
                                            {category.name}
                                        </div>

                                        {/* Progress Bar + Daily Cap */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {category.isOverBudget ? (
                                                    /* Over Budget: 100% bar + overflow */
                                                    <div className="flex gap-1 flex-1">
                                                        {/* Main bar (100%) */}
                                                        <div className="relative h-2 bg-white/10 dark:bg-white/10 rounded-full overflow-hidden flex-1">
                                                            <div className="h-full bg-white dark:bg-white" style={{ width: "100%" }} />
                                                        </div>
                                                        {/* Overflow bar */}
                                                        <div
                                                            className="relative h-2 bg-red-500/20 rounded-full overflow-hidden"
                                                            style={{ width: `${Math.min(category.percentage - 100, 100)}%` }}
                                                        >
                                                            <div className="h-full bg-red-500" style={{ width: "100%" }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Under Budget: Normal bar */
                                                    <div className="relative h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex-1">
                                                        <div
                                                            className="h-full bg-white dark:bg-white"
                                                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                                {/* Percentage */}
                                                <span className={`text-xs font-medium min-w-[45px] text-right ${category.isOverBudget ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>
                                                    {category.percentage.toFixed(0)}%
                                                </span>
                                            </div>

                                            {/* Contextual Daily Cap */}
                                            <div className="text-xs text-right">
                                                {category.isOverBudget ? (
                                                    <span className="text-red-400">Limit exceeded</span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Can spend <span className="text-white dark:text-white font-medium">{dailyCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₴</span> / day
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Spent / Limit */}
                                        <div className="text-right text-sm pt-1">
                                            <span className={category.isOverBudget ? "text-red-500 font-medium" : "text-gray-900 dark:text-white"}>
                                                {category.spent.toLocaleString()}
                                            </span>
                                            <span className="text-gray-400"> / </span>
                                            {editingId === category.id ? (
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleSaveLimit}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-20 bg-transparent border-b border-white/20 text-white dark:text-white text-sm pb-1 focus:border-white focus:outline-none text-right"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition"
                                                    onClick={() => handleStartEdit(category.id, category.budgetLimit)}
                                                >
                                                    {category.budgetLimit.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Edit Button */}
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                            <button
                                                onClick={() => handleStartEdit(category.id, category.budgetLimit)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                title="Edit Budget Limit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel (25%) - Financial Health Dashboard */}
            <div className="w-[25%] h-full bg-gray-50 dark:bg-[#111] border-l border-gray-200 dark:border-white/10 p-6 overflow-y-auto flex flex-col items-center justify-start">
                <div className="w-full">
                    {/* Consolidated Month Overview Card */}
                    <div className="w-full bg-white/5 dark:bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 space-y-6">
                        {/* Health Indicator Badge - Top Right */}
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500">
                                Month Overview
                            </p>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${totalPercentage > 100 ? "bg-red-500/20 text-red-400" :
                                totalPercentage > 80 ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-green-500/20 text-green-400"
                                }`}>
                                {totalPercentage.toFixed(0)}% Used
                            </div>
                        </div>

                        {/* Hero Section - Total Remaining */}
                        <div className="py-4">
                            <p className="text-xs text-gray-400 mb-2">Safe to Spend</p>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                {safeToSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-lg font-bold text-gray-400 ml-2">₴</span>
                            </p>
                        </div>

                        {/* Global Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Spent: {data.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span>Limit: {data.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${totalPercentage > 100 ? "bg-red-500" : "bg-white"}`}
                                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Burn Rate Insight */}
                        <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-gray-400 mb-2">Spending Pace</p>
                            {isSpendingFast ? (
                                <p className="text-sm text-orange-400">
                                    ⚠️ Pacing too fast. Consider slowing down.
                                </p>
                            ) : isSpendingSlow ? (
                                <p className="text-sm text-green-400">
                                    ✓ Spending slower than planned. Good job!
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">
                                    → On track with monthly budget.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {data.daysLeftInMonth} days left in month
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
