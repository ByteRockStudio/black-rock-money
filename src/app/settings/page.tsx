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
import { Moon, Sun } from "lucide-react";

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

    const handleDeleteAccount = async (id: string) => {
        if (!confirm(t("settings.confirm_delete_account"))) return;
        const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchAccounts();
        else alert(t("settings.delete_account_failed"));
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm(t("settings.confirm_delete_category"))) return;
        const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchCategories();
        else alert(t("settings.delete_category_failed"));
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#efede7] dark:bg-black font-sans transition-colors duration-500">
            {/* The Settings Card */}
            <div className="w-full max-w-5xl h-[75vh] rounded-[40px] overflow-hidden shadow-2xl flex bg-white dark:bg-neutral-900">

                {/* Left Column: Navigation Sidebar */}
                <aside className="w-1/3 flex flex-col bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white border-r border-neutral-100 dark:border-white/5 relative z-20">
                    <div className="p-8 h-full flex flex-col">
                        {/* Back Button */}
                        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6 group w-fit">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">{t("common.back")}</span>
                        </Link>

                        <h1 className="text-3xl font-bold mb-8 px-2">{t("nav.settings")}</h1>

                        <nav className="space-y-3 flex-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === tab.id
                                        ? "bg-black/5 dark:bg-white/10 font-bold text-black dark:text-white"
                                        : "text-gray-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="text-lg">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Right Column: Content Area */}
                <main className="w-2/3 relative h-full">
                    {/* Background & Overlay */}
                    <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center px-10 overflow-y-auto">
                        <div className="w-full max-w-xl py-10">
                            {activeTab === "general" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                                    <h2 className="text-3xl font-bold mb-8 text-white text-center">{t("settings.global_settings")}</h2>
                                    <div className="bg-white/10 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                                        <label className="block text-sm font-medium mb-3 text-white/80">{t("settings.exchange_rate")}</label>
                                        <div className="flex gap-4">
                                            <Input
                                                type="number"
                                                value={localExchangeRate}
                                                onChange={(e) => setLocalExchangeRate(e.target.value)}
                                                className="border-b border-white/30 bg-transparent text-white placeholder:text-white/50 focus:border-white rounded-none h-12 text-lg px-0 shadow-none focus-visible:ring-0"
                                                step="0.01"
                                            />
                                            <Button onClick={handleExchangeRateUpdate} className="h-12 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-semibold transition-colors">
                                                {t("common.save")}
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "accounts" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-3xl font-bold text-white">{t("settings.accounts")}</h2>
                                        <Button onClick={() => openAccountModal()} className="bg-white text-black hover:bg-gray-200 rounded-full px-6 py-2 font-semibold h-auto">
                                            <Plus size={18} className="mr-2" />
                                            {t("settings.add_account")}
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {accounts.map((acc) => (
                                            <div key={acc.id} className="w-full bg-white/10 border border-white/10 rounded-xl p-4 flex justify-between items-center transition-transform hover:scale-[1.02] backdrop-blur-sm group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/10 rounded-full text-white">
                                                        {acc.type === 'card' ? <CreditCard size={20} /> : <Banknote size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg text-white">{acc.name}</div>
                                                        <div className="text-sm text-white/70 font-mono">{formatAccountBalance(acc)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-red-400 hover:bg-white/10 rounded-full h-9 w-9" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeTab === "categories" && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full flex flex-col gap-8">
                                    {/* Income Categories */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                            <h3 className="text-xl font-semibold text-white">{t("settings.income_categories")}</h3>
                                            <Button size="sm" variant="ghost" onClick={() => openCategoryModal("income")} className="text-white hover:bg-white/20 rounded-full">
                                                <Plus size={16} className="mr-1" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-[20vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {incomeCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-colors group">
                                                    <span className="font-medium text-white">{cat.name}</span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={() => openCategoryModal("income", cat)}>
                                                                    <Edit2 size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
                                                                    <Trash2 size={14} />
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
                                        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                            <h3 className="text-xl font-semibold text-white">{t("settings.expense_categories")}</h3>
                                            <Button size="sm" variant="ghost" onClick={() => openCategoryModal("expense")} className="text-white hover:bg-white/20 rounded-full">
                                                <Plus size={16} className="mr-1" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {expenseCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-colors group">
                                                    <div>
                                                        <div className="font-medium text-white">{cat.name}</div>
                                                        {cat.budgetLimit && <div className="text-xs text-white/60 mt-0.5">{t("budget.limit")}: {cat.budgetLimit}</div>}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={() => openCategoryModal("expense", cat)}>
                                                                    <Edit2 size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
                                                                    <Trash2 size={14} />
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
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                                    <h2 className="text-3xl font-bold mb-8 text-white text-center">Appearance</h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                                            <div className="flex items-center gap-4 text-white">
                                                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                                                <span className="font-medium text-lg">Theme</span>
                                            </div>
                                            <div className="flex bg-white/10 rounded-full p-1">
                                                <button
                                                    onClick={() => setTheme("light")}
                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${theme === "light" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"}`}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    onClick={() => setTheme("dark")}
                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${theme === "dark" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"}`}
                                                >
                                                    Dark
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                                            <div className="flex items-center gap-4 text-white">
                                                <Globe size={20} />
                                                <span className="font-medium text-lg">Language</span>
                                            </div>
                                            <div className="flex bg-white/10 rounded-full p-1">
                                                <button
                                                    onClick={() => setLanguage("en")}
                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "en" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"}`}
                                                >
                                                    EN
                                                </button>
                                                <button
                                                    onClick={() => setLanguage("ukr")}
                                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "ukr" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"}`}
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
        </div>
    );
}

