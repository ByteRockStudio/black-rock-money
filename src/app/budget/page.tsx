"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { DashboardLayout } from "@/components/DashboardLayout";

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

    useCloseOnEscape(() => router.push("/"));

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
            <DashboardLayout>
                <div className="flex h-full items-center justify-center">
                    <span className="text-zinc-400">Loading...</span>
                </div>
            </DashboardLayout>
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
    const isSpendingFast = totalPercentage > expectedPercentage + 10;
    const isSpendingSlow = totalPercentage < expectedPercentage - 10;

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
                {/* Overview Header */}
                <div className="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Safe to Spend</h2>
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                                    {safeToSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-lg font-medium text-zinc-400 ml-1">₴</span>
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${totalPercentage > 100 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                                totalPercentage > 80 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                                    "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                }`}>
                                {totalPercentage.toFixed(0)}% Used
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Spent: {data.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span>Limit: {data.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${totalPercentage > 100 ? "bg-red-500" : "bg-zinc-900 dark:bg-white"}`}
                                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Burn Rate Insight */}
                        <div className="mt-4 text-sm">
                            {isSpendingFast ? (
                                <p className="text-orange-600 dark:text-orange-400">⚠️ Pacing too fast. {data.daysLeftInMonth} days left.</p>
                            ) : isSpendingSlow ? (
                                <p className="text-green-600 dark:text-green-400">✓ Spending slower than planned. {data.daysLeftInMonth} days left.</p>
                            ) : (
                                <p className="text-zinc-500">→ On track. {data.daysLeftInMonth} days left in month.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="max-w-4xl mx-auto grid grid-cols-[2fr_3fr_1.5fr_80px] gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <div>Category</div>
                        <div>Progress</div>
                        <div className="text-right">Spent / Limit</div>
                        <div></div>
                    </div>
                </div>

                {/* Category List */}
                <div className="flex-1 overflow-y-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        {data.categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                                <p>No budgets set yet.</p>
                                <p className="text-sm mt-2">Add budget limits in Settings → Categories</p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {data.categories.map((category) => {
                                    const remaining = Math.max(0, category.budgetLimit - category.spent);
                                    const dailyCap = data.daysLeftInMonth > 0 ? remaining / data.daysLeftInMonth : 0;

                                    return (
                                        <div key={category.id} className="grid grid-cols-[2fr_3fr_1.5fr_80px] gap-4 items-start py-4 border-b border-zinc-100 dark:border-zinc-800 group">
                                            {/* Category Name */}
                                            <div className="font-medium text-zinc-900 dark:text-white">
                                                {category.name}
                                            </div>

                                            {/* Progress Bar + Daily Cap */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex-1">
                                                        <div
                                                            className={`h-full ${category.isOverBudget ? "bg-red-500" : "bg-zinc-900 dark:bg-white"}`}
                                                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-medium min-w-[45px] text-right ${category.isOverBudget ? "text-red-500" : "text-zinc-500"}`}>
                                                        {category.percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="text-xs text-right">
                                                    {category.isOverBudget ? (
                                                        <span className="text-red-500">Limit exceeded</span>
                                                    ) : (
                                                        <span className="text-zinc-400">
                                                            Can spend <span className="text-zinc-700 dark:text-zinc-300 font-medium">{dailyCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₴</span> / day
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Spent / Limit */}
                                            <div className="text-right text-sm">
                                                <span className={category.isOverBudget ? "text-red-500 font-medium" : "text-zinc-900 dark:text-white"}>
                                                    {category.spent.toLocaleString()}
                                                </span>
                                                <span className="text-zinc-400"> / </span>
                                                {editingId === category.id ? (
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={handleSaveLimit}
                                                        onKeyDown={handleKeyDown}
                                                        className="w-20 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm pb-1 focus:border-zinc-900 dark:focus:border-white focus:outline-none text-right"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        className="text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition"
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
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
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
            </div>
        </DashboardLayout>
    );
}
