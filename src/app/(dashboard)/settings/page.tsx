"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Wallet, CreditCard, Banknote, Plus, Settings, Layers, Monitor, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AccountModal } from "@/components/AccountModal";
import { CategoryModal } from "@/components/CategoryModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Moon, Sun, Globe } from "lucide-react";
import { toast } from "sonner";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    startingBalance: number;
    currency: string;
    isDefault: boolean;
    isSavings: boolean;
}

interface Category {
    id: string;
    name: string;
    type: string;
    budgetLimit: number | null;
    userId: string | null;
}

type Tab = "general" | "accounts" | "categories";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, exchangeRate, setExchangeRate, theme, setTheme, language, setLanguage } = useSettings();

    useCloseOnEscape(() => router.push('/'));

    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [localExchangeRate, setLocalExchangeRate] = useState(String(exchangeRate));

    // Modals state
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryType, setCategoryType] = useState<"income" | "expense">("expense");

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
            fetchAccounts();
            fetchCategories();
        }
    }, [session]);

    useEffect(() => {
        setLocalExchangeRate(String(exchangeRate));
    }, [exchangeRate]);

    const fetchAccounts = async () => {
        const res = await fetch("/api/accounts");
        if (res.ok) {
            const data = await res.json();
            setAccounts(data);
        }
    };

    const fetchCategories = async () => {
        const res = await fetch("/api/categories");
        if (res.ok) {
            const data = await res.json();
            setCategories(data);
        }
    };

    const handleExchangeRateUpdate = () => {
        const rate = parseFloat(localExchangeRate);
        if (!isNaN(rate) && rate > 0) {
            setExchangeRate(rate);
            toast.success("Exchange rate updated");
        }
    };

    const handleDeleteAccount = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: "Delete Account",
            message: "Are you sure? This will delete all transactions associated with this account.",
            onConfirm: async () => {
                const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
                if (res.ok) {
                    toast.success("Account deleted");
                    fetchAccounts();
                } else {
                    toast.error("Failed to delete account");
                }
            }
        });
    };

    const handleDeleteCategory = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: "Delete Category",
            message: "Are you sure? This cannot be undone.",
            onConfirm: async () => {
                const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
                if (res.ok) {
                    toast.success("Category deleted");
                    fetchCategories();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to delete category");
                }
            }
        });
    };

    const handleSetDefault = async (accountId: string) => {
        const res = await fetch("/api/accounts/set-default", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId }),
        });
        if (res.ok) {
            toast.success("Default account updated");
            fetchAccounts();
        } else {
            toast.error("Failed to set default account");
        }
    };

    const formatAccountBalance = (account: Account) => {
        if (account.currency === "USD") {
            const uahEquivalent = account.balance * exchangeRate;
            return `$${account.balance.toLocaleString()} ≈ ₴${uahEquivalent.toFixed(0)}`;
        }
        return `₴${account.balance.toLocaleString()}`;
    };

    const incomeCategories = categories.filter(c => c.type === "income");
    const expenseCategories = categories.filter(c => c.type === "expense");

    const openAccountModal = (account?: Account) => {
        setSelectedAccount(account || null);
        setIsAccountModalOpen(true);
    };

    const openCategoryModal = (type: "income" | "expense", category?: Category) => {
        setCategoryType(type);
        setSelectedCategory(category || null);
        setIsCategoryModalOpen(true);
    };

    if (status === "loading") return <div className="flex h-full items-center justify-center text-zinc-500">Loading...</div>;
    if (!session) return null;

    const tabs = [
        { id: "general", label: "Global", icon: <Settings size={16} /> },
        { id: "accounts", label: "Accounts", icon: <Wallet size={16} /> },
        { id: "categories", label: "Categories", icon: <Layers size={16} /> },
    ];

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
                </div>

                {/* Theme & Language Toggles */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setTheme("light")}
                            className={`p-2 rounded-md transition-colors ${theme === "light" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
                        >
                            <Sun size={16} />
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={`p-2 rounded-md transition-colors ${theme === "dark" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
                        >
                            <Moon size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setLanguage("en")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === "en" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage("ukr")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === "ukr" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
                        >
                            UK
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "general" && (
                    <div className="max-w-xl space-y-6">
                        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                                USD Exchange Rate (to UAH)
                            </label>
                            <div className="flex gap-3 items-center">
                                <Input
                                    type="number"
                                    value={localExchangeRate}
                                    onChange={(e) => setLocalExchangeRate(e.target.value)}
                                    className="bg-zinc-50 dark:bg-[#111111] border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    step="0.01"
                                />
                                <Button onClick={handleExchangeRateUpdate} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "accounts" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Accounts</h2>
                            <Button onClick={() => openAccountModal()} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl">
                                <Plus size={16} className="mr-2" />
                                Add Account
                            </Button>
                        </div>
                        <div className="grid gap-3">
                            {accounts.map((acc) => (
                                <div key={acc.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            {acc.type === 'card' ? <CreditCard size={18} className="text-zinc-500" /> : <Banknote size={18} className="text-zinc-500" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-900 dark:text-white">{acc.name}</span>
                                                <button onClick={() => handleSetDefault(acc.id)} title={acc.isDefault ? "Default" : "Set as default"}>
                                                    <Star size={14} className={acc.isDefault ? "fill-amber-500 text-amber-500" : "text-zinc-300 dark:text-zinc-600 hover:text-amber-500"} />
                                                </button>
                                                {acc.isSavings && <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">Savings</span>}
                                            </div>
                                            <div className="text-sm text-zinc-500">{formatAccountBalance(acc)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => handleDeleteAccount(acc.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "categories" && (
                    <div className="space-y-8">
                        {/* Income Categories */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Income Sources</h3>
                                <Button variant="ghost" size="sm" onClick={() => openCategoryModal("income")} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                    <Plus size={14} className="mr-1" />
                                    Add
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {incomeCategories.map((cat) => (
                                    <div key={cat.id} className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                                        {cat.userId && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openCategoryModal("income", cat)} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-zinc-400 hover:text-red-500">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Expense Categories */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Expense Categories</h3>
                                <Button variant="ghost" size="sm" onClick={() => openCategoryModal("expense")} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                    <Plus size={14} className="mr-1" />
                                    Add
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {expenseCategories.map((cat) => (
                                    <div key={cat.id} className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <div>
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                                            {cat.budgetLimit && <span className="text-xs text-zinc-400 ml-2">₴{cat.budgetLimit}</span>}
                                        </div>
                                        {cat.userId && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openCategoryModal("expense", cat)} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-zinc-400 hover:text-red-500">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                account={selectedAccount}
                onSave={fetchAccounts}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                category={selectedCategory}
                type={categoryType}
                onSave={fetchCategories}
            />

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
