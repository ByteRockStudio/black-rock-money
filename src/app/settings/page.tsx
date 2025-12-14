"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Wallet, CreditCard, Banknote, Plus, Settings, Layers, Monitor, Globe, Star } from "lucide-react";
import { AccountModal } from "@/components/AccountModal";
import { CategoryModal } from "@/components/CategoryModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    startingBalance: number;
    currency: string;
    isDefault: boolean;
}

interface Category {
    id: string;
    name: string;
    type: string;
    budgetLimit: number | null;
    userId: string | null;
}

type Tab = "general" | "accounts" | "categories" | "appearance";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, exchangeRate, setExchangeRate, theme, setTheme, language, setLanguage } = useSettings();

    useCloseOnEscape(() => router.push("/"));

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
            title: t("settings.delete_account_title") || "Delete Account",
            message: t("settings.confirm_delete_account"),
            onConfirm: async () => {
                const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });

                if (res.status === 401) {
                    toast.error("Unauthorized session. Please login again.");
                    router.push("/login");
                    return;
                }

                if (res.ok) {
                    toast.success("Account deleted successfully");
                    fetchAccounts();
                } else {
                    toast.error(t("settings.delete_account_failed"));
                }
            }
        });
    };

    const handleDeleteCategory = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: t("settings.delete_category_title") || "Delete Category",
            message: t("settings.confirm_delete_category"),
            onConfirm: async () => {
                const res = await fetch(`/api/categories?id=${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (res.status === 401) {
                    toast.error("Unauthorized session. Please login again.");
                    router.push("/login");
                    return;
                }

                if (res.ok) {
                    toast.success("Category deleted successfully");
                    fetchCategories();
                } else {
                    const data = await res.json();
                    toast.error(data.error || t("settings.delete_category_failed"));
                }
            }
        });
    };

    const handleSetDefault = async (accountId: string) => {
        try {
            const res = await fetch("/api/accounts/set-default", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId }),
            });

            if (res.status === 401) {
                toast.error("Unauthorized session. Please login again.");
                router.push("/login");
                return;
            }

            if (res.ok) {
                toast.success("Default account updated");
                fetchAccounts();
            } else {
                toast.error("Failed to set default account");
            }
        } catch (error) {
            toast.error("Error setting default account");
        }
    };

    const formatAccountBalance = (account: Account) => {
        if (account.currency === "USD") {
            const uahEquivalent = account.balance * exchangeRate;
            return `${account.balance} USD / ≈ ${uahEquivalent.toFixed(0)} UAH`;
        }
        return `${account.balance} ${account.currency}`;
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

    if (status === "loading") return (
        <DashboardLayout>
            <div className="flex min-h-full items-center justify-center">{t("common.loading")}</div>
        </DashboardLayout>
    );
    if (!session) return null;

    const tabs = [
        { id: "general", label: t("settings.global_settings"), icon: <Settings size={18} /> },
        { id: "accounts", label: t("settings.accounts"), icon: <Wallet size={18} /> },
        { id: "categories", label: t("settings.categories"), icon: <Layers size={18} /> },
        { id: "appearance", label: "Appearance", icon: <Monitor size={18} /> },
    ];

    return (
        <DashboardLayout>
            <div className="flex h-full bg-white dark:bg-zinc-950">
                {/* Left Sidebar: Tabs */}
                <aside className="w-64 flex-shrink-0 h-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                {tab.icon}
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 h-full overflow-y-auto p-8">
                    <div className="max-w-2xl mx-auto">
                        {activeTab === "general" && (
                            <section>
                                <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">{t("settings.global_settings")}</h2>
                                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                                    <label className="block text-sm font-medium mb-4 text-zinc-700 dark:text-zinc-300">{t("settings.exchange_rate")}</label>
                                    <div className="flex gap-4 items-center">
                                        <Input
                                            type="number"
                                            value={localExchangeRate}
                                            onChange={(e) => setLocalExchangeRate(e.target.value)}
                                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white max-w-[200px]"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                        <Button onClick={handleExchangeRateUpdate} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
                                            {t("common.save")}
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === "accounts" && (
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("settings.accounts")}</h2>
                                    <Button onClick={() => openAccountModal()} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
                                        <Plus size={16} className="mr-2" />
                                        {t("settings.add_account")}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {accounts.map((acc) => (
                                        <div key={acc.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300">
                                                    {acc.type === 'card' ? <CreditCard size={18} /> : <Banknote size={18} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-zinc-900 dark:text-white">{acc.name}</span>
                                                        <button
                                                            onClick={() => handleSetDefault(acc.id)}
                                                            className="transition-colors"
                                                            title={acc.isDefault ? "Default account" : "Set as default"}
                                                        >
                                                            <Star
                                                                size={16}
                                                                className={acc.isDefault ? "fill-purple-500 text-purple-500" : "text-zinc-400 hover:text-purple-500"}
                                                            />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{formatAccountBalance(acc)}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500" onClick={() => handleDeleteAccount(acc.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeTab === "categories" && (
                            <section className="space-y-8">
                                {/* Income Categories */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("settings.income_categories")}</h3>
                                        <Button size="sm" variant="ghost" onClick={() => openCategoryModal("income")} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                            <Plus size={14} className="mr-1" />
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {incomeCategories.map((cat) => (
                                            <div key={cat.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                <span className="font-medium text-zinc-900 dark:text-white text-sm">{cat.name}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {cat.userId && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={() => openCategoryModal("income", cat)}>
                                                                <Edit2 size={12} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Expense Categories */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("settings.expense_categories")}</h3>
                                        <Button size="sm" variant="ghost" onClick={() => openCategoryModal("expense")} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                            <Plus size={14} className="mr-1" />
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {expenseCategories.map((cat) => (
                                            <div key={cat.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                <div>
                                                    <div className="font-medium text-zinc-900 dark:text-white text-sm">{cat.name}</div>
                                                    {cat.budgetLimit && <div className="text-xs text-zinc-500 mt-0.5">{t("budget.limit")}: {cat.budgetLimit}</div>}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {cat.userId && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={() => openCategoryModal("expense", cat)}>
                                                                <Edit2 size={12} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === "appearance" && (
                            <section>
                                <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">Appearance</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                                            {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                                            <span className="font-medium text-sm">Theme</span>
                                        </div>
                                        <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${theme === "light" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                                            >
                                                Light
                                            </button>
                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${theme === "dark" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                                            >
                                                Dark
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                                            <Globe size={20} />
                                            <span className="font-medium text-sm">Language</span>
                                        </div>
                                        <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
                                            <button
                                                onClick={() => setLanguage("en")}
                                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${language === "en" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                                            >
                                                EN
                                            </button>
                                            <button
                                                onClick={() => setLanguage("ukr")}
                                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${language === "ukr" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                                            >
                                                UKR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </main>
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
        </DashboardLayout>
    );
}
