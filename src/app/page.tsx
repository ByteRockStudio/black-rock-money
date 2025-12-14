"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, ArrowRight, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSettings } from "@/contexts/SettingsContext";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
}

interface BudgetCategory {
    id: string;
    name: string;
    budgetLimit: number;
    spent: number;
    percentage: number;
}

interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: string;
    category: { name: string };
    account: { name: string; currency: string };
    description?: string;
}

interface SummaryData {
    totalBalance: Record<string, number>;
    monthlyStats: Record<string, { income: number; expense: number }>;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { exchangeRate, t } = useSettings();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [accountsRes, budgetRes, transactionsRes, summaryRes] = await Promise.all([
                fetch("/api/accounts"),
                fetch("/api/budget"),
                fetch(`/api/transactions?start=${startOfMonth(new Date()).toISOString()}&end=${endOfMonth(new Date()).toISOString()}&limit=5`),
                fetch("/api/summary"),
            ]);

            if (accountsRes.ok) setAccounts(await accountsRes.json());
            if (budgetRes.ok) {
                const data = await budgetRes.json();
                setBudgetData(data.categories?.slice(0, 3) || []);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.slice(0, 5));
            }
            if (summaryRes.ok) setSummary(await summaryRes.json());
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalBalanceUAH = () => {
        if (!summary) return 0;
        let total = 0;
        Object.entries(summary.totalBalance).forEach(([currency, amount]) => {
            if (currency === "USD") {
                total += amount * exchangeRate;
            } else {
                total += amount;
            }
        });
        return total;
    };

    const formatCurrency = (amount: number, currency: string = "UAH") => {
        const symbol = currency === "UAH" ? "₴" : currency === "USD" ? "$" : currency;
        return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    if (status === "loading") {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full text-zinc-500">
                    Loading...
                </div>
            </DashboardLayout>
        );
    }

    if (!session) {
        return null;
    }

    const totalBalance = calculateTotalBalanceUAH();
    const monthlyIncome = summary?.monthlyStats?.["UAH"]?.income || 0;
    const monthlyExpense = summary?.monthlyStats?.["UAH"]?.expense || 0;

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-4">

                    {/* Widget 1: Total Balance (Large, spans 6 cols) */}
                    <div className="col-span-12 md:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                {t("header.balance") || "Total Balance"}
                            </span>
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <Wallet size={16} className="text-zinc-600 dark:text-zinc-400" />
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                            {loading ? "..." : formatCurrency(totalBalance)}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600 dark:text-green-400">
                                +{formatCurrency(monthlyIncome)} income
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400">
                                -{formatCurrency(monthlyExpense)} expenses
                            </span>
                        </div>
                    </div>

                    {/* Widget 2: Accounts Overview (spans 6 cols) */}
                    <div className="col-span-12 md:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Accounts
                            </span>
                            <Link
                                href="/settings"
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                Manage <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-zinc-400 text-sm">Loading...</div>
                            ) : accounts.length === 0 ? (
                                <div className="text-zinc-400 text-sm">No accounts yet</div>
                            ) : (
                                accounts.slice(0, 4).map((account) => (
                                    <div key={account.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                {account.type === "card" ? (
                                                    <CreditCard size={14} className="text-zinc-600 dark:text-zinc-400" />
                                                ) : (
                                                    <Banknote size={14} className="text-zinc-600 dark:text-zinc-400" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{account.name}</span>
                                        </div>
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {formatCurrency(account.balance, account.currency)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Widget 3: Budget Progress (spans 4 cols) */}
                    <div className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Budget Progress
                            </span>
                            <Link
                                href="/budget"
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                View all <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-zinc-400 text-sm">Loading...</div>
                            ) : budgetData.length === 0 ? (
                                <div className="text-zinc-400 text-sm">No budgets set</div>
                            ) : (
                                budgetData.map((category) => (
                                    <div key={category.id} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-700 dark:text-zinc-300">{category.name}</span>
                                            <span className={`text-xs ${category.percentage > 100 ? "text-red-500" : "text-zinc-500"}`}>
                                                {category.spent.toLocaleString()} / {category.budgetLimit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${category.percentage > 100 ? "bg-red-500" : "bg-zinc-900 dark:bg-white"}`}
                                                style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Widget 4: Recent Transactions (spans 8 cols) */}
                    <div className="col-span-12 md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Recent Transactions
                            </span>
                            <Link
                                href="/transactions"
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                View all <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-zinc-400 text-sm">Loading...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-zinc-400 text-sm">No transactions yet</div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${tx.type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                                                <TrendingUp size={14} className={tx.type === "income" ? "text-green-600" : "text-zinc-600 dark:text-zinc-400"} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white">{tx.category.name}</div>
                                                <div className="text-xs text-zinc-500">{format(new Date(tx.date), "MMM d")} • {tx.account.name}</div>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-medium ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-zinc-900 dark:text-white"}`}>
                                            {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
