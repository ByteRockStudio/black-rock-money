"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { TransactionRow } from "@/components/TransactionRow";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "sonner";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { PrivacyMask } from "@/components/PrivacyMask";

// Placeholder for Analytics Widgets (will implement in next step)
// Analytics Panel with new styling
function AnalyticsPanel({ transactions }: { transactions: any[] }) {
    // Calculate Monthly Summary
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const netResult = totalIncome - totalExpense;

    // Calculate Top Spenders
    const categorySpending: Record<string, number> = {};
    transactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
            const catName = t.category.name;
            categorySpending[catName] = (categorySpending[catName] || 0) + t.amount;
        });

    const sortedCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5

    return (
        <div className="h-full w-full border-l border-zinc-200 dark:border-zinc-800 p-8 flex flex-col gap-8 overflow-y-auto">

            {/* Widget 1: Monthly Summary */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Monthly Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/5">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Income</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            <PrivacyMask value={`+${totalIncome.toLocaleString()}`} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/5">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expense</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            <PrivacyMask value={`-${totalExpense.toLocaleString()}`} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Net Result</div>
                    <div className={`text-xl font-bold ${netResult >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                        <PrivacyMask value={`${netResult >= 0 ? "+" : ""}${netResult.toLocaleString()}`} />
                    </div>
                </div>
            </div>

            {/* Widget 2: Top Spenders */}
            <div className="space-y-4 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Top Spenders</h2>
                {sortedCategories.length === 0 ? (
                    <div className="text-gray-400 text-sm italic">No expenses yet.</div>
                ) : (
                    <div className="space-y-6">
                        {sortedCategories.map(([name, amount]) => {
                            const percentage = Math.min((amount / totalExpense) * 100, 100);
                            return (
                                <div key={name} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            <PrivacyMask value={amount.toLocaleString()} />
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gray-800 dark:bg-white/80 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TransactionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useSettings();

    useCloseOnEscape(() => router.push('/'));

    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchTransactions();
        }
    }, [session, currentDate, filterType]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Construct query params
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            let url = `/api/transactions?start=${start}&end=${end}`;

            if (filterType !== "all") {
                url += `&type=${filterType}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: "Delete Transaction",
            message: "Are you sure you want to delete this transaction?",
            onConfirm: async () => {
                const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
                if (res.ok) {
                    toast.success("Transaction deleted");
                    fetchTransactions();
                } else {
                    toast.error("Failed to delete transaction");
                }
            },
        });
    };

    const handleEdit = (transaction: any) => {
        setEditingTransaction(transaction);
    };

    const handleCloseEdit = () => {
        setEditingTransaction(null);
        fetchTransactions(); // Refresh list after edit
    };

    if (status === "loading") return null;

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* Left Panel: Transaction Table (75%) */}
            <div className="w-[75%] h-full flex flex-col px-8">

                {/* Sticky Header */}
                <div className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4">
                            {/* Date Selector */}
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 rounded-md px-2 py-1">
                                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[100px] text-center">
                                    {format(currentDate, "MMMM yyyy")}
                                </span>
                                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Type Filter */}
                            <div className="flex bg-gray-100 dark:bg-white/10 rounded-md p-1">
                                {(["all", "expense", "income"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${filterType === type
                                            ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/10">
                                <th className="px-4 py-2 font-medium w-[120px]">Date</th>
                                <th className="px-4 py-2 font-medium">Category</th>
                                <th className="px-4 py-2 font-medium">Account</th>
                                <th className="px-4 py-2 font-medium">Comment</th>
                                <th className="px-4 py-2 font-medium text-right">Amount</th>
                                <th className="px-4 py-2 font-medium text-right w-[80px]"></th>
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Transaction List (Table Body) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                {transactions.map((tx) => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Right Panel: Analytics (25%) */}
            <div className="w-[25%] h-full hidden md:block">
                <AnalyticsPanel transactions={transactions} />
            </div>

            {/* Modal for Editing */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-lg shadow-xl w-full max-w-md relative p-6">
                        <button
                            onClick={handleCloseEdit}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            {t("common.close")}
                        </button>
                        <AddExpenseModal
                            onClose={handleCloseEdit}
                            initialData={editingTransaction}
                        />
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
            />
        </div>
    );
}
