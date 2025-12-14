"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { TransactionRow } from "@/components/TransactionRow";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "sonner";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function TransactionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useSettings();

    useCloseOnEscape(() => router.push("/"));

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

    // Analytics calculations
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const netResult = totalIncome - totalExpense;

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
        fetchTransactions();
    };

    if (status === "loading") return null;

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
                {/* Header with filters */}
                <div className="sticky top-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Date Selector */}
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white min-w-[120px] text-center">
                                    {format(currentDate, "MMMM yyyy")}
                                </span>
                                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Type Filter */}
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                                {(["all", "expense", "income"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === type
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                            }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">Income:</span>
                                <span className="font-medium text-green-600">+{totalIncome.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">Expense:</span>
                                <span className="font-medium text-zinc-900 dark:text-white">-{totalExpense.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500">Net:</span>
                                <span className={`font-medium ${netResult >= 0 ? "text-green-600" : "text-red-500"}`}>
                                    {netResult >= 0 ? "+" : ""}{netResult.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="grid grid-cols-[120px_1fr_1fr_1fr_120px_80px] gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <div>Date</div>
                        <div>Category</div>
                        <div>Account</div>
                        <div>Comment</div>
                        <div className="text-right">Amount</div>
                        <div></div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-zinc-400">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
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

            {/* Modal for Editing */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl shadow-xl w-full max-w-md relative p-6">
                        <button
                            onClick={handleCloseEdit}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
        </DashboardLayout>
    );
}
