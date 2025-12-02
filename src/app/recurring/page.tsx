"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isSameMonth } from "date-fns";
import { ArrowLeft, Play, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function RecurringPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

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
                fetch("/api/categories"),
            ]);

            if (expensesRes.ok) setRecurringExpenses(await expensesRes.json());
            if (accountsRes.ok) {
                const accs = await accountsRes.json();
                setAccounts(accs);
                if (!formData.accountId && accs.length > 0) {
                    setFormData(prev => ({ ...prev, accountId: accs[0].id }));
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
        setViewMode('summary');
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

    // Calculate Total Monthly
    const totalMonthly = recurringExpenses.reduce((sum, expense) => {
        let monthlyAmount = expense.amount;
        if (expense.recurrenceType === "DAILY") monthlyAmount = expense.amount * 30 / expense.recurrenceInterval;
        if (expense.recurrenceType === "WEEKLY") monthlyAmount = expense.amount * 4 / expense.recurrenceInterval;
        if (expense.recurrenceType === "YEARLY") monthlyAmount = expense.amount / 12 / expense.recurrenceInterval;
        if (expense.recurrenceType === "MONTHLY") monthlyAmount = expense.amount / expense.recurrenceInterval;

        return sum + monthlyAmount;
    }, 0);

    // Calculate Paid vs Pending
    const currentMonth = new Date();
    const paidExpenses = recurringExpenses.filter(expense =>
        expense.lastAppliedDate && isSameMonth(new Date(expense.lastAppliedDate), currentMonth)
    );
    const pendingExpenses = recurringExpenses.filter(expense =>
        !expense.lastAppliedDate || !isSameMonth(new Date(expense.lastAppliedDate), currentMonth)
    );

    const paidTotal = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingTotal = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    if (status === "loading") return null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#efede7] dark:bg-black font-sans">

            {/* Left Panel: List (70%) */}
            <div className="w-[70%] h-full flex flex-col bg-white dark:bg-black px-8 relative">

                {/* Header */}
                <div className="sticky top-0 z-20 bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recurring Expenses</h1>
                    </div>

                    {/* Column Headers */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4 px-4">
                        <div className="text-left">Name</div>
                        <div className="text-right">Amount</div>
                        <div className="text-left">Account</div>
                        <div className="text-left">Category</div>
                        <div className="text-left">Recurrence</div>
                        <div className="text-left">Next Due</div>
                        <div className="text-right">Actions</div>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
                    ) : recurringExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
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
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center w-full bg-white dark:bg-black border-b border-gray-50 dark:border-white/5 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition group"
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {expense.name}
                                        </div>
                                        <div className="text-right font-medium text-gray-900 dark:text-white">
                                            {expense.amount.toLocaleString()} <span className="text-xs text-gray-400">{expense.account.currency}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {expense.account.name}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {expense.category.name}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {getRecurrenceLabel(expense.recurrenceType, expense.recurrenceInterval)}
                                        </div>
                                        <div className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                                            {format(nextDue, "MMM d")}
                                        </div>
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleManualApply(expense.id, expense.name)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                title="Apply Now"
                                            >
                                                <Play size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(expense)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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

                {/* Bottom Summary */}
                <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 p-4 px-8 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Monthly Estimate
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-normal text-gray-400">/ month</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Summary or Form (30%) */}
            <div className="w-[30%] h-full bg-gray-50 dark:bg-[#111] border-l border-gray-200 dark:border-white/10 p-8 overflow-y-auto">
                {viewMode === 'summary' ? (
                    /* Summary Dashboard */
                    <div className="flex flex-col items-center justify-center h-full space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Monthly Commitment</h2>
                            <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                {totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <p className="text-sm text-gray-400">UAH / month</p>
                        </div>

                        <div className="w-full space-y-4 border-t border-gray-200 dark:border-white/10 pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid This Month</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paidExpenses.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-medium text-gray-900 dark:text-white">
                                        {paidTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-400">UAH</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingExpenses.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-medium text-gray-900 dark:text-white">
                                        {pendingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-400">UAH</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setViewMode('form')}
                            className="w-full mt-8"
                            size="lg"
                        >
                            Add New Recurring Expense
                        </Button>
                    </div>
                ) : (
                    /* Form View */
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? "Edit Recurring Expense" : "New Recurring Expense"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Netflix Subscription"
                                    required
                                    className="bg-white dark:bg-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                <Input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    required
                                    className="bg-white dark:bg-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
                                <select
                                    name="accountId"
                                    value={formData.accountId}
                                    onChange={handleInputChange}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-black px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-black px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4 border-t border-gray-200 dark:border-white/10 pt-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurrence</label>

                                <div className="grid grid-cols-2 gap-2">
                                    {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, recurrenceType: type }))}
                                            className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${formData.recurrenceType === type
                                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                                : "bg-white dark:bg-black text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-400"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Every</span>
                                    <Input
                                        name="recurrenceInterval"
                                        type="number"
                                        min="1"
                                        value={formData.recurrenceInterval}
                                        onChange={handleInputChange}
                                        className="w-20 bg-white dark:bg-black"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {formData.recurrenceType.toLowerCase().replace("ly", "")}(s)
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                <Input
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                    className="bg-white dark:bg-black"
                                />
                            </div>

                            <div className="pt-4 flex gap-2">
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                        Cancel
                                    </Button>
                                )}
                                <Button type="submit" className="flex-1">
                                    {editingId ? "Update" : "Create"}
                                </Button>
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
