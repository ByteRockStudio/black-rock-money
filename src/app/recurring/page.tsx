"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isSameMonth } from "date-fns";
import { Play, Edit, Trash2, PauseCircle, PlayCircle, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function RecurringPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useCloseOnEscape(() => router.push("/"));

    // Data State
    const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        accountId: "",
        categoryId: "",
        recurrenceType: "MONTHLY",
        recurrenceInterval: "1",
        startDate: format(new Date(), "yyyy-MM-dd"),
    });

    // Confirmation Modal
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
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, accountsRes, categoriesRes] = await Promise.all([
                fetch("/api/recurring"),
                fetch("/api/accounts"),
                fetch("/api/categories?type=EXPENSE"),
            ]);

            if (expensesRes.ok) setRecurringExpenses(await expensesRes.json());
            if (accountsRes.ok) {
                const accs = await accountsRes.json();
                setAccounts(accs);
                if (!formData.accountId && accs.length > 0) {
                    const defaultAccount = accs.find((acc: any) => acc.isDefault);
                    setFormData(prev => ({ ...prev, accountId: defaultAccount ? defaultAccount.id : accs[0].id }));
                }
            }
            if (categoriesRes.ok) {
                const cats = await categoriesRes.json();
                setCategories(cats);
                if (!formData.categoryId && cats.length > 0) {
                    setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            amount: "",
            accountId: accounts.length > 0 ? accounts[0].id : "",
            categoryId: categories.length > 0 ? categories[0].id : "",
            recurrenceType: "MONTHLY",
            recurrenceInterval: "1",
            startDate: format(new Date(), "yyyy-MM-dd"),
        });
        setViewMode('list');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/recurring/${editingId}` : "/api/recurring";
        const method = editingId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingId ? "Recurring expense updated" : "Recurring expense created");
                fetchData();
                resetForm();
            } else {
                const error = await res.text();
                toast.error(`Error: ${error}`);
            }
        } catch (error) {
            toast.error("Failed to save recurring expense");
        }
    };

    const handleEdit = (expense: any) => {
        setEditingId(expense.id);
        setFormData({
            name: expense.name,
            amount: expense.amount.toString(),
            accountId: expense.accountId,
            categoryId: expense.categoryId,
            recurrenceType: expense.recurrenceType,
            recurrenceInterval: expense.recurrenceInterval.toString(),
            startDate: format(new Date(expense.startDate), "yyyy-MM-dd"),
        });
        setViewMode('form');
    };

    const handleDelete = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: "Delete Recurring Expense",
            message: "Are you sure you want to delete this recurring expense?",
            onConfirm: async () => {
                const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
                if (res.ok) {
                    toast.success("Recurring expense deleted");
                    fetchData();
                } else {
                    toast.error("Failed to delete");
                }
            },
        });
    };

    const handleManualApply = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/recurring/apply/${id}`, { method: "POST" });
            if (res.ok) {
                toast.success(`Transaction created for ${name}`);
                fetchData();
            } else {
                toast.error("Failed to apply transaction");
            }
        } catch (error) {
            toast.error("Error applying transaction");
        }
    };

    const handleTogglePause = async (id: string) => {
        try {
            const res = await fetch(`/api/recurring/${id}/toggle-pause`, { method: "PUT" });
            if (res.ok) {
                toast.success("Pause status updated");
                fetchData();
            } else {
                toast.error("Failed to update pause status");
            }
        } catch (error) {
            toast.error("Error updating pause status");
        }
    };

    const calculateNextDue = (expense: any) => {
        const start = new Date(expense.startDate);
        const last = expense.lastAppliedDate ? new Date(expense.lastAppliedDate) : null;

        if (!last) return start;

        const interval = expense.recurrenceInterval;
        switch (expense.recurrenceType) {
            case "DAILY": return addDays(last, interval);
            case "WEEKLY": return addWeeks(last, interval);
            case "MONTHLY": return addMonths(last, interval);
            case "YEARLY": return addYears(last, interval);
            default: return last;
        }
    };

    const getRecurrenceLabel = (type: string, interval: number) => {
        if (interval === 1) {
            switch (type) {
                case "DAILY": return "Daily";
                case "WEEKLY": return "Weekly";
                case "MONTHLY": return "Monthly";
                case "YEARLY": return "Yearly";
            }
        }
        return `Every ${interval} ${type.toLowerCase().replace("ly", "s")}`;
    };

    // Calculate Total Monthly (exclude paused)
    const activeExpenses = recurringExpenses.filter(expense => !expense.isPaused);
    const totalMonthly = activeExpenses.reduce((sum, expense) => {
        let monthlyAmount = expense.amount;
        if (expense.recurrenceType === "DAILY") monthlyAmount = expense.amount * 30 / expense.recurrenceInterval;
        if (expense.recurrenceType === "WEEKLY") monthlyAmount = expense.amount * 4 / expense.recurrenceInterval;
        if (expense.recurrenceType === "YEARLY") monthlyAmount = expense.amount / 12 / expense.recurrenceInterval;
        if (expense.recurrenceType === "MONTHLY") monthlyAmount = expense.amount / expense.recurrenceInterval;

        return sum + monthlyAmount;
    }, 0);

    // Calculate Paid vs Pending
    const currentMonth = new Date();
    const paidExpenses = activeExpenses.filter(expense =>
        expense.lastAppliedDate && isSameMonth(new Date(expense.lastAppliedDate), currentMonth)
    );
    const pendingExpenses = activeExpenses.filter(expense =>
        !expense.lastAppliedDate || !isSameMonth(new Date(expense.lastAppliedDate), currentMonth)
    );

    if (status === "loading") return null;

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
                {/* Overview Header */}
                <div className="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Monthly Estimate</h2>
                            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                                {totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-lg font-medium text-zinc-400 ml-1">₴</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                                <div className="text-zinc-500 dark:text-zinc-400">Paid</div>
                                <div className="font-semibold text-green-600 dark:text-green-400">{paidExpenses.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-zinc-500 dark:text-zinc-400">Pending</div>
                                <div className="font-semibold text-orange-500">{pendingExpenses.length}</div>
                            </div>
                            <button
                                onClick={() => setViewMode('form')}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                            >
                                <Plus size={16} />
                                Add New
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <>
                        {/* Table Header */}
                        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                            <div className="max-w-5xl mx-auto grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                <div>Name</div>
                                <div className="text-right">Amount</div>
                                <div>Account</div>
                                <div>Recurrence</div>
                                <div>Next Due</div>
                                <div className="text-right">Actions</div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-6">
                            <div className="max-w-5xl mx-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center h-40 text-zinc-400">Loading...</div>
                                ) : recurringExpenses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                                        <p>No recurring expenses found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        {recurringExpenses.map((expense) => {
                                            const nextDue = calculateNextDue(expense);
                                            const isOverdue = isBefore(nextDue, new Date());

                                            return (
                                                <div
                                                    key={expense.id}
                                                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 items-center py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition group ${expense.isPaused ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="font-medium text-zinc-900 dark:text-white truncate flex items-center gap-2">
                                                        {expense.name}
                                                        {expense.isPaused && (
                                                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                PAUSED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right font-medium text-zinc-900 dark:text-white">
                                                        {expense.amount.toLocaleString()} <span className="text-xs text-zinc-400">{expense.account.currency}</span>
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                        {expense.account.name}
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {getRecurrenceLabel(expense.recurrenceType, expense.recurrenceInterval)}
                                                    </div>
                                                    <div className={`text-sm ${expense.isPaused ? 'line-through text-zinc-400' : isOverdue ? "text-red-500 font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                                                        {format(nextDue, "MMM d")}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleTogglePause(expense.id)}
                                                            className={`p-1.5 rounded-md transition-colors ${expense.isPaused ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                                                            title={expense.isPaused ? "Resume" : "Pause"}
                                                        >
                                                            {expense.isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                                                        </button>
                                                        {!expense.isPaused && (
                                                            <button
                                                                onClick={() => handleManualApply(expense.id, expense.name)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                                title="Apply Now"
                                                            >
                                                                <Play size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Form View */
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="max-w-lg mx-auto">
                            <div className="flex items-center gap-3 mb-8">
                                <button
                                    onClick={resetForm}
                                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {editingId ? "Edit Recurring Expense" : "New Recurring Expense"}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Netflix Subscription"
                                        required
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none placeholder:text-zinc-400"
                                    />
                                </div>

                                {/* Amount + Account */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Amount</label>
                                        <input
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Account</label>
                                        <select
                                            name="accountId"
                                            value={formData.accountId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none"
                                        >
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Category + Start Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Category</label>
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Start Date</label>
                                        <input
                                            name="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-4 py-3 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Recurrence */}
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Recurrence</label>
                                    <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                        {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, recurrenceType: type }))}
                                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${formData.recurrenceType === type
                                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                    }`}
                                            >
                                                {type.charAt(0) + type.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-sm text-zinc-500">Every</span>
                                        <input
                                            name="recurrenceInterval"
                                            type="number"
                                            min="1"
                                            value={formData.recurrenceInterval}
                                            onChange={handleInputChange}
                                            className="w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm px-3 py-2 rounded-lg focus:border-zinc-900 dark:focus:border-white focus:outline-none text-center"
                                        />
                                        <span className="text-sm text-zinc-500">
                                            {formData.recurrenceType.toLowerCase().replace("ly", "")}(s)
                                        </span>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-4 flex gap-3">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-3 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                                    >
                                        {editingId ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
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
