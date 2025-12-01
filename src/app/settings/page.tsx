"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, ArrowLeft, Wallet, CreditCard, Banknote, Plus, Settings, Layers, Monitor, Globe } from "lucide-react";
import Link from "next/link";
import { AccountModal } from "@/components/AccountModal";
import { CategoryModal } from "@/components/CategoryModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    startingBalance: number;
    currency: string;
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

    if (status === "loading") return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
    if (!session) return null;

    const tabs = [
        { id: "general", label: t("settings.global_settings"), icon: <Settings size={18} /> },
        { id: "accounts", label: t("settings.accounts"), icon: <Wallet size={18} /> },
        { id: "categories", label: t("settings.categories"), icon: <Layers size={18} /> },
        { id: "appearance", label: "Appearance", icon: <Monitor size={18} /> },
    ];

    return (
        <div className="min-h-screen w-full bg-[#efede7] dark:bg-[hsl(0_0%_3.92%)] transition-colors duration-300 flex flex-col items-center justify-center p-6">
            {/* Main Container: The Workspace */}
            <div className="w-full max-w-[1600px] mx-auto h-[90vh] rounded-3xl overflow-hidden flex shadow-2xl bg-white dark:bg-black transition-colors duration-300">

                {/* Left Sidebar: Navigation */}
                <aside className="w-80 flex-shrink-0 flex flex-col border-r border-black/5 dark:border-white/10 bg-white/50 dark:bg-black backdrop-blur-xl transition-colors duration-300">
                    <div className="p-8 h-full flex flex-col">
                        {/* Back Button */}
                        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors mb-8 group w-fit">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium text-sm">{t("common.back")}</span>
                        </Link>

                        <h1 className="text-2xl font-bold mb-8 px-2 text-zinc-900 dark:text-white tracking-tight">{t("nav.settings")}</h1>

                        <nav className="space-y-2 flex-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === tab.id
                                        ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                                        : "text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Right Content Area: Visuals */}
                <main className="flex-1 relative h-full bg-zinc-900 text-white">
                    {/* Background & Overlay */}
                    <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Content Container */}
                    <div className="relative z-10 h-full overflow-y-auto">
                        <div className="max-w-4xl mx-auto py-12 px-8">
                            {/* Header inside content area for consistent access */}
                            <div className="absolute top-6 right-8 z-50">
                                <Header />
                            </div>

                            {activeTab === "general" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-bold mb-6 text-white">{t("settings.global_settings")}</h2>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                                        <label className="block text-sm font-medium mb-4 text-white/80">{t("settings.exchange_rate")}</label>
                                        <div className="flex gap-4 items-center">
                                            <Input
                                                type="number"
                                                value={localExchangeRate}
                                                onChange={(e) => setLocalExchangeRate(e.target.value)}
                                                className="bg-transparent border-b border-white/20 text-white text-2xl font-normal p-2.5 focus:border-white transition-colors w-full outline-none ring-0 placeholder:text-white/20 rounded-none h-auto shadow-none focus-visible:ring-0 max-w-[200px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                            <Button onClick={handleExchangeRateUpdate} className="h-10 px-8 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-colors">
                                                {t("common.save")}
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "accounts" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-bold text-white">{t("settings.accounts")}</h2>
                                        <Button onClick={() => openAccountModal()} className="bg-white text-black hover:bg-zinc-200 rounded-full px-5 py-2 text-sm font-medium h-auto">
                                            <Plus size={16} className="mr-2" />
                                            {t("settings.add_account")}
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {accounts.map((acc) => (
                                            <div key={acc.id} className="w-full bg-white/5 hover:bg-white/10 border-b border-white/10 p-4 flex justify-between items-center transition-colors rounded-lg group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white/10 rounded-lg text-white">
                                                        {acc.type === 'card' ? <CreditCard size={18} /> : <Banknote size={18} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-base text-white">{acc.name}</div>
                                                        <div className="text-xs text-white/60 font-mono mt-0.5">{formatAccountBalance(acc)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8">
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-red-400 hover:bg-white/10 rounded-full h-8 w-8" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeTab === "categories" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                                    {/* Income Categories */}
                                    <div>
                                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                            <h3 className="text-xl font-semibold text-white">{t("settings.income_categories")}</h3>
                                            <Button size="sm" variant="ghost" onClick={() => openCategoryModal("income")} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full text-xs">
                                                <Plus size={14} className="mr-1" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {incomeCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                                                    <span className="font-medium text-white text-sm">{cat.name}</span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full" onClick={() => openCategoryModal("income", cat)}>
                                                                    <Edit2 size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
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
                                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                            <h3 className="text-xl font-semibold text-white">{t("settings.expense_categories")}</h3>
                                            <Button size="sm" variant="ghost" onClick={() => openCategoryModal("expense")} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full text-xs">
                                                <Plus size={14} className="mr-1" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {expenseCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                                                    <div>
                                                        <div className="font-medium text-white text-sm">{cat.name}</div>
                                                        {cat.budgetLimit && <div className="text-xs text-white/60 mt-0.5">{t("budget.limit")}: {cat.budgetLimit}</div>}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full" onClick={() => openCategoryModal("expense", cat)}>
                                                                    <Edit2 size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
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
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-bold mb-6 text-white">Appearance</h2>
                                    <div className="space-y-4 max-w-xl">
                                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3 text-white">
                                                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                                                <span className="font-medium text-sm">Theme</span>
                                            </div>
                                            <div className="flex bg-black/20 rounded-full p-1">
                                                <button
                                                    onClick={() => setTheme("light")}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${theme === "light" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"}`}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    onClick={() => setTheme("dark")}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${theme === "dark" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"}`}
                                                >
                                                    Dark
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-3 text-white">
                                                <Globe size={20} />
                                                <span className="font-medium text-sm">Language</span>
                                            </div>
                                            <div className="flex bg-black/20 rounded-full p-1">
                                                <button
                                                    onClick={() => setLanguage("en")}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${language === "en" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"}`}
                                                >
                                                    EN
                                                </button>
                                                <button
                                                    onClick={() => setLanguage("ukr")}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${language === "ukr" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"}`}
                                                >
                                                    UKR
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
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
        </div>
    );
}
