"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
    const dailySafeRate = data.daysLeftInMonth > 0 ? safeToSpend / data.daysLeftInMonth : 0;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#efede7] dark:bg-black font-sans">
            {/* Left Panel (70%) - Budget List */}
            <div className="w-[70%] h-full flex flex-col bg-white dark:bg-black px-8 relative">
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
                            {data.categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="grid grid-cols-[2fr_3fr_1.5fr_80px] gap-4 items-center w-full bg-white dark:bg-black border-b border-gray-50 dark:border-white/5 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition group"
                                >
                                    {/* Category Name */}
                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                        {category.name}
                                    </div>

                                    {/* Progress Bar */}
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

                                    {/* Spent / Limit */}
                                    <div className="text-right text-sm">
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
                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStartEdit(category.id, category.budgetLimit)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                            title="Edit Budget Limit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel (30%) - Budget Summary */}
            <div className="w-[30%] h-full bg-gray-50 dark:bg-[#111] border-l border-gray-200 dark:border-white/10 p-6 overflow-y-auto flex flex-col items-center justify-center">
                <div className="w-full space-y-6">
                    {/* Budget Health */}
                    <div className="w-full bg-white/5 dark:bg-white/5 rounded-lg p-6 border border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-2">
                            Budget Health
                        </p>
                        <p className={`text-5xl font-light ${totalPercentage > 100 ? "text-red-500" : totalPercentage > 80 ? "text-yellow-500" : "text-green-500"}`}>
                            {totalPercentage.toFixed(0)}%
                        </p>
                    </div>

                    {/* Safe to Spend */}
                    <div className="w-full bg-white/5 dark:bg-white/5 rounded-lg p-6 border border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-2">
                            Safe to Spend
                        </p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                            {safeToSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            <span className="text-sm font-normal text-gray-400 ml-2">UAH</span>
                        </p>
                    </div>

                    {/* Daily Safe Rate */}
                    <div className="w-full bg-white/5 dark:bg-white/5 rounded-lg p-6 border border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-2">
                            Daily Safe Rate
                        </p>
                        <p className="text-3xl font-light text-gray-900 dark:text-white">
                            {dailySafeRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            <span className="text-sm font-normal text-gray-400 ml-2">/ day</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            {data.daysLeftInMonth} days left in month
                        </p>
                    </div>

                    {/* Total Comparison */}
                    <div className="w-full bg-white/5 dark:bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500">
                                    Total Spent
                                </p>
                                <p className="text-2xl font-light text-gray-900 dark:text-white">
                                    {data.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500">
                                    Total Budget
                                </p>
                                <p className="text-2xl font-light text-gray-900 dark:text-white">
                                    {data.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
