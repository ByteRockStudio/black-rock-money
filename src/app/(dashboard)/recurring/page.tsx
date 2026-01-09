"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isSameMonth } from "date-fns";
import { ArrowLeft, Play, Edit2, Trash2, PauseCircle, PlayCircle, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { PrivacyMask } from "@/components/PrivacyMask";

export default function RecurringPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useCloseOnEscape(() => router.push('/'));

    // Data State
    const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // View Mode State
    const [viewMode, setViewMode] = useState<'summary' | 'form'>('summary');

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
                if (accs.length > 0 && !formData.accountId) {
                    const defaultAcc = accs.find((a: any) => a.isDefault) || accs[0];
                    setFormData(prev => ({ ...prev, accountId: defaultAcc.id }));
                }
            }
            if (categoriesRes.ok) {
                const cats = await categoriesRes.json();
                setCategories(cats);
                if (cats.length > 0 && !formData.categoryId) {
                    setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            amount: "",
            accountId: accounts.length > 0 ? (accounts.find((a: any) => a.isDefault)?.id || accounts[0].id) : "",
            categoryId: categories.length > 0 ? categories[0].id : "",
            recurrenceType: "MONTHLY",
            recurrenceInterval: "1",
            startDate: format(new Date(), "yyyy-MM-dd"),
        });
        setViewMode('summary');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingId ? "PUT" : "POST";
        const body = { ...formData, id: editingId };

        try {
            const res = await fetch("/api/recurring", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(editingId ? "Updated" : "Created");
                resetForm();
                fetchData();
            } else {
                toast.error("Failed to save");
            }
        } catch (error) {
            toast.error("Error saving");
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
            title: "Delete Expense",
            message: "Are you sure? This cannot be undone.",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Deleted");
                        fetchData();
                    } else {
                        toast.error("Failed to delete");
                    }
                } catch (error) {
                    toast.error("Error deleting");
                }
            },
        });
    };

    const handleManualApply = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/recurring/apply/${id}`, { method: "POST" });
            if (res.ok) {
                toast.success(`Applied: ${name}`);
                fetchData();
            } else {
                toast.error("Failed to apply");
            }
        } catch (error) {
            toast.error("Error applying");
        }
    };

    const handleTogglePause = async (id: string) => {
        try {
            const res = await fetch(`/api/recurring/${id}/toggle-pause`, { method: "PUT" });
            if (res.ok) {
                toast.success("Status updated");
                fetchData();
            } else {
                toast.error("Failed to update");
            }
        } catch (error) {
            toast.error("Error updating");
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
        return `${interval}${type.charAt(0).toLowerCase()}`;
    };

    // Calculate totals (exclude paused)
    const activeExpenses = recurringExpenses.filter(e => !e.isPaused);
    const totalMonthly = activeExpenses.reduce((sum, expense) => {
        let monthlyAmount = expense.amount;
        if (expense.recurrenceType === "DAILY") monthlyAmount = expense.amount * 30 / expense.recurrenceInterval;
        if (expense.recurrenceType === "WEEKLY") monthlyAmount = expense.amount * 4 / expense.recurrenceInterval;
        if (expense.recurrenceType === "YEARLY") monthlyAmount = expense.amount / 12 / expense.recurrenceInterval;
        if (expense.recurrenceType === "MONTHLY") monthlyAmount = expense.amount / expense.recurrenceInterval;
        return sum + monthlyAmount;
    }, 0);

    const currentMonth = new Date();
    const paidExpenses = activeExpenses.filter(e =>
        e.lastAppliedDate && isSameMonth(new Date(e.lastAppliedDate), currentMonth)
    );
    const pendingExpenses = activeExpenses.filter(e =>
        !e.lastAppliedDate || !isSameMonth(new Date(e.lastAppliedDate), currentMonth)
    );
    const paidTotal = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (status === "loading") return null;

    // Input styling classes
    const inputClasses = `w-full rounded-lg px-4 py-2.5 text-sm transition-all
        bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:ring-white`;

    const selectClasses = `w-full rounded-lg px-4 py-2.5 text-sm transition-all cursor-pointer
        bg-zinc-50 border border-zinc-200 text-zinc-900
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-white`;

    const labelClasses = "block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider";

    return (
        <div className="flex h-full w-full overflow-hidden divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left Panel (66%) - High Density List */}
            <div className="w-[66%] h-full flex flex-col px-6 relative">
                {/* Compact Header */}
                <div className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 py-4 bg-white dark:bg-[#171717]">
                    <div className="flex items-center gap-3 mb-3">
                        <Link href="/" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Recurring Expenses</h1>
                    </div>

                    {/* Column Headers - Compact */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-2 items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3">
                        <div className="text-left">Name</div>
                        <div className="text-right">Amount</div>
                        <div className="text-left">Freq</div>
                        <div className="text-left">Next Due</div>
                        <div></div>
                    </div>
                </div>

                {/* List Content - High Density */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">Loading...</div>
                    ) : recurringExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-sm">
                            <p>No recurring expenses</p>
                            <p className="text-xs mt-1">Add one from the right panel</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {recurringExpenses.map((expense) => {
                                const nextDue = calculateNextDue(expense);
                                const isOverdue = isBefore(nextDue, new Date());

                                return (
                                    <div
                                        key={expense.id}
                                        className={`grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-2 items-center w-full border-b border-zinc-100 dark:border-zinc-800 py-2.5 px-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition group ${expense.isPaused ? 'opacity-50' : ''}`}
                                    >
                                        {/* Name + Badge */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                                {expense.name}
                                            </span>
                                            {expense.isPaused && (
                                                <span className="text-[9px] bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                                                    Paused
                                                </span>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right text-sm font-medium text-zinc-900 dark:text-white">
                                            <PrivacyMask value={`${expense.amount.toLocaleString()}`} />
                                            <span className="text-zinc-400 text-xs ml-0.5">{expense.account.currency}</span>
                                        </div>

                                        {/* Frequency - Compact */}
                                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                            {getRecurrenceLabel(expense.recurrenceType, expense.recurrenceInterval)}
                                        </div>

                                        {/* Next Due */}
                                        <div className={`text-[11px] ${expense.isPaused ? 'line-through text-zinc-400' : isOverdue ? "text-red-500 font-medium" : "text-zinc-500 dark:text-zinc-400"}`}>
                                            {format(nextDue, "MMM d")}
                                        </div>

                                        {/* Actions - Show on Hover */}
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleTogglePause(expense.id)}
                                                className={`p-1 rounded transition-colors ${expense.isPaused ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20' : 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'}`}
                                                title={expense.isPaused ? "Resume" : "Pause"}
                                            >
                                                {expense.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                            </button>
                                            {!expense.isPaused && (
                                                <button
                                                    onClick={() => handleManualApply(expense.id, expense.name)}
                                                    className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                                    title="Apply Now"
                                                >
                                                    <Play size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(expense)}
                                                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel (33%) - Summary or Form */}
            <div className="w-[33%] h-full bg-zinc-50/80 dark:bg-[#111111]/50 p-5 overflow-y-auto">
                {viewMode === 'summary' ? (
                    <div className="w-full space-y-4">
                        {/* Monthly Overview Card - Compact */}
                        <div className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-sm space-y-4">
                            {/* Header */}
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                Monthly Overview
                            </p>

                            {/* Hero Metric */}
                            <div className="py-2">
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Total Commitments</p>
                                <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    <PrivacyMask value={`${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    <span className="text-sm font-medium text-zinc-400 ml-1">₴</span>
                                </p>
                            </div>

                            {/* Stats - Compact */}
                            <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Paid ({paidExpenses.length})</span>
                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        <PrivacyMask value={`${paidTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Pending ({pendingExpenses.length})</span>
                                    <span className="text-sm font-medium text-orange-500 dark:text-orange-400">
                                        <PrivacyMask value={`${pendingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => setViewMode('form')}
                            className="w-full h-10 text-sm font-semibold flex items-center justify-center gap-2
                                bg-zinc-900 text-white hover:bg-zinc-800
                                dark:bg-white dark:text-black dark:hover:bg-zinc-200
                                rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add Recurring
                        </button>
                    </div>
                ) : (
                    /* Compact Form */
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-5">
                            <button
                                onClick={resetForm}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                {editingId ? "Edit" : "New"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className={labelClasses}>Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Netflix"
                                    required
                                    className={inputClasses}
                                />
                            </div>

                            {/* Amount + Account */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClasses}>Amount</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Account</label>
                                    <select
                                        name="accountId"
                                        value={formData.accountId}
                                        onChange={handleInputChange}
                                        required
                                        className={selectClasses}
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Category + Start Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClasses}>Category</label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        required
                                        className={selectClasses}
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Start Date</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                        className={`${inputClasses} dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-60`}
                                    />
                                </div>
                            </div>

                            {/* Recurrence - Compact Segmented */}
                            <div>
                                <label className={labelClasses}>Recurrence</label>
                                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                                    {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, recurrenceType: type }))}
                                            className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-all ${formData.recurrenceType === type
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                }`}
                                        >
                                            {type.charAt(0)}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] text-zinc-500">Every</span>
                                    <input
                                        name="recurrenceInterval"
                                        type="number"
                                        min="1"
                                        value={formData.recurrenceInterval}
                                        onChange={handleInputChange}
                                        className="w-12 bg-transparent border-b border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-sm text-center focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                                    />
                                    <span className="text-[10px] text-zinc-500">
                                        {formData.recurrenceType.toLowerCase().replace("ly", "")}(s)
                                    </span>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 flex gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 h-9 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 h-9 text-sm font-semibold rounded-lg transition-colors
                                        bg-zinc-900 text-white hover:bg-zinc-800
                                        dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                                >
                                    {editingId ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
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
        </div>
    );
}
