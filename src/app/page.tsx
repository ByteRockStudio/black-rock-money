"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowRight, CreditCard, Banknote, Clock, Zap, FolderPlus, ArrowLeftRight, FileText } from "lucide-react";
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
    isSavings?: boolean;
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

interface BudgetCategory {
    id: string;
    name: string;
    budgetLimit: number;
    spent: number;
    percentage: number;
}

interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    nextDue: string;
    isPaused: boolean;
}

interface SummaryData {
    totalBalance: Record<string, number>;
    monthlyStats: Record<string, { income: number; expense: number }>;
}

// Privacy-aware amount display component
function PrivateAmount({ amount, prefix = "", className = "" }: { amount: number; prefix?: string; className?: string }) {
    const { privacyMode } = useSettings();
    const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return (
        <span className={`${className} ${privacyMode ? "blur-sm select-none" : ""}`}>
            {prefix}{formatted}
        </span>
    );
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { exchangeRate, privacyMode, t } = useSettings();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
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
            const [accountsRes, transactionsRes, summaryRes, budgetRes, recurringRes] = await Promise.all([
                fetch("/api/accounts"),
                fetch(`/api/transactions?start=${startOfMonth(new Date()).toISOString()}&end=${endOfMonth(new Date()).toISOString()}&limit=7`),
                fetch("/api/summary"),
                fetch("/api/budget"),
                fetch("/api/recurring"),
            ]);

            if (accountsRes.ok) setAccounts(await accountsRes.json());
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(Array.isArray(data) ? data.slice(0, 7) : []);
            }
            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (budgetRes.ok) {
                const data = await budgetRes.json();
                setBudgetCategories(data.categories?.slice(0, 3) || []);
            }
            if (recurringRes.ok) {
                const data = await recurringRes.json();
                // Get next 2 non-paused recurring expenses
                const upcoming = data
                    .filter((r: RecurringExpense) => !r.isPaused)
                    .slice(0, 2);
                setRecurringExpenses(upcoming);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalBalance = () => {
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

    const calculateSavingsBalance = () => {
        return accounts
            .filter(acc => acc.isSavings)
            .reduce((sum, acc) => {
                if (acc.currency === "USD") {
                    return sum + acc.balance * exchangeRate;
                }
                return sum + acc.balance;
            }, 0);
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

    const totalBalance = calculateTotalBalance();
    const savingsBalance = calculateSavingsBalance();
    const monthlyIncome = summary?.monthlyStats?.["UAH"]?.income || 0;
    const monthlyExpense = summary?.monthlyStats?.["UAH"]?.expense || 0;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Row 1: Financial Health Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Balance */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl">
                            <Wallet size={20} className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Total Balance</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                <PrivateAmount amount={totalBalance} prefix="₴" />
                            </p>
                        </div>
                    </div>

                    {/* Monthly Income */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Income</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                <PrivateAmount amount={monthlyIncome} prefix="+₴" />
                            </p>
                        </div>
                    </div>

                    {/* Monthly Expenses */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Expenses</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400 tracking-tight">
                                <PrivateAmount amount={monthlyExpense} prefix="-₴" />
                            </p>
                        </div>
                    </div>

                    {/* Savings */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <PiggyBank size={20} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Savings</p>
                            <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tracking-tight">
                                <PrivateAmount amount={savingsBalance} prefix="₴" />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Row 2: Accounts Overview */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">My Accounts</h3>
                        <Link
                            href="/settings"
                            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                        >
                            Manage <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {loading ? (
                            <div className="text-zinc-400 text-sm py-4">Loading...</div>
                        ) : accounts.length === 0 ? (
                            <div className="text-zinc-400 text-sm py-4">No accounts yet</div>
                        ) : (
                            accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex-shrink-0 w-48 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                                            {account.type === "card" ? (
                                                <CreditCard size={14} className="text-zinc-500" />
                                            ) : (
                                                <Banknote size={14} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">{account.name}</span>
                                    </div>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        <PrivateAmount
                                            amount={account.balance}
                                            prefix={account.currency === "USD" ? "$" : "₴"}
                                        />
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Row 3: Main Activity Grid (Bento Box) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Col 1: Recent Transactions (50% = 2 cols) */}
                    <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
                            <Link
                                href="/transactions"
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                View All <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-zinc-400 text-sm py-4">Loading...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-zinc-400 text-sm py-4 text-center">No transactions yet</div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                        <div className={`p-2 rounded-lg ${tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                                            {tx.type === "income" ? (
                                                <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <TrendingDown size={14} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{tx.category.name}</p>
                                            <p className="text-xs text-zinc-500">{format(new Date(tx.date), "MMM d")}</p>
                                        </div>
                                        <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
                                            <PrivateAmount
                                                amount={tx.amount}
                                                prefix={tx.type === "income" ? "+₴" : "-₴"}
                                            />
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Col 2: Budget Status (25% = 1 col) */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Monthly Budget</h3>
                            <Link
                                href="/budget"
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-zinc-400 text-sm py-4">Loading...</div>
                            ) : budgetCategories.length === 0 ? (
                                <div className="text-zinc-400 text-sm py-4 text-center">No budgets set</div>
                            ) : (
                                budgetCategories.map((category) => (
                                    <div key={category.id} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-600 dark:text-zinc-400">{category.name}</span>
                                            <span className={`font-medium ${category.percentage > 100 ? "text-red-500" : "text-zinc-500"}`}>
                                                {category.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
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

                    {/* Col 3: Recurring & Quick Actions (25% = 1 col) */}
                    <div className="space-y-4">
                        {/* Upcoming Payments */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Upcoming</h3>
                                <Link
                                    href="/recurring"
                                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    <ArrowRight size={12} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {loading ? (
                                    <div className="text-zinc-400 text-sm">Loading...</div>
                                ) : recurringExpenses.length === 0 ? (
                                    <div className="text-zinc-400 text-xs">No upcoming payments</div>
                                ) : (
                                    recurringExpenses.map((expense) => (
                                        <div key={expense.id} className="flex items-center gap-2">
                                            <Clock size={12} className="text-zinc-400" />
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate flex-1">{expense.name}</span>
                                            <span className="text-xs font-medium text-zinc-900 dark:text-white">
                                                <PrivateAmount amount={expense.amount} prefix="₴" />
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <Link
                                    href="/settings"
                                    className="flex flex-col items-center gap-1.5 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                                >
                                    <FolderPlus size={16} className="text-zinc-500" />
                                    <span className="text-[10px] text-zinc-500">Category</span>
                                </Link>
                                <Link
                                    href="/settings"
                                    className="flex flex-col items-center gap-1.5 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                                >
                                    <ArrowLeftRight size={16} className="text-zinc-500" />
                                    <span className="text-[10px] text-zinc-500">Transfer</span>
                                </Link>
                                <Link
                                    href="/recurring"
                                    className="flex flex-col items-center gap-1.5 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                                >
                                    <FileText size={16} className="text-zinc-500" />
                                    <span className="text-[10px] text-zinc-500">Note</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
