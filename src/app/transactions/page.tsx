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

// Placeholder for Analytics Widgets (will implement in next step)
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
        <div className="h-full w-full bg-black/60 backdrop-blur-md p-8 border-l border-white/10 text-white flex flex-col gap-8 overflow-y-auto">

            {/* Widget 1: Monthly Summary */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-white/10 pb-2">Monthly Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-sm text-white/50">Income</div>
                        <div className="text-xl font-bold text-green-400">+{totalIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <div className="text-sm text-white/50">Expense</div>
                        <div className="text-xl font-bold text-white">-{totalExpense.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
                    <div className="text-sm text-white/70">Net Result</div>
                    <div className={`text-2xl font-bold ${netResult >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {netResult >= 0 ? "+" : ""}{netResult.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Widget 2: Top Spenders */}
            <div className="space-y-4 flex-1">
                <h2 className="text-xl font-bold border-b border-white/10 pb-2">Top Spenders</h2>
                {sortedCategories.length === 0 ? (
                    <div className="text-white/30 text-sm italic">No expenses yet.</div>
                ) : (
                    <div className="space-y-6">
                        {sortedCategories.map(([name, amount]) => {
                            const percentage = Math.min((amount / totalExpense) * 100, 100);
                            return (
                                <div key={name} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-white/70">{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white/80 rounded-full"
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
        <div className="h-screen w-full flex overflow-hidden bg-background font-sans">
            {/* Global Background */}
            <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center bg-no-repeat z-0" />
            <div className="absolute inset-0 bg-black/50 z-0" />

            {/* Content Wrapper */}
            <div className="relative z-10 flex w-full h-full">

                {/* Left Panel: Transaction Feed (65%) */}
                <div className="w-[65%] h-full flex flex-col bg-black/20 backdrop-blur-sm">

                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Link href="/" className="text-white/70 hover:text-white flex items-center gap-2 transition">
                                <ArrowLeft size={20} />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-white">Transactions</h1>
                            <div className="w-[100px]"></div> {/* Spacer for alignment */}
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Date Selector */}
                            <div className="flex items-center gap-4 bg-white/10 rounded-full px-4 py-2">
                                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="text-white/70 hover:text-white">
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-white font-medium min-w-[140px] text-center">
                                    {format(currentDate, "MMMM yyyy")}
                                </span>
                                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="text-white/70 hover:text-white">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Type Filter Tabs */}
                            <div className="flex bg-white/10 rounded-lg p-1">
                                {(["all", "expense", "income"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === type
                                                ? "bg-white text-black shadow-sm"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                            }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-white/50">Loading...</div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-white/50">
                                <p>No transactions found for this period.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col pb-20">
                                {transactions.map((tx) => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Analytics (35%) */}
                <div className="w-[35%] h-full hidden md:block">
                    <AnalyticsPanel transactions={transactions} />
                </div>
            </div>

            {/* Modal for Editing */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border text-card-foreground rounded-lg shadow-lg w-full max-w-md relative p-6">
                        <button
                            onClick={handleCloseEdit}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
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
