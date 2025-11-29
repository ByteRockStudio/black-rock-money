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
        <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">
            {/* Left Sidebar - Fixed Width */}
            <aside className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-[#efede7] dark:bg-neutral-900 h-full overflow-y-auto z-20 relative text-neutral-800 dark:text-white">
                <div className="p-8">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">{t("common.back")}</span>
                    </Link>

                    <h1 className="text-3xl font-hard-rock tracking-wide mb-8">{t("nav.settings")}</h1>

                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md"
                                    : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.icon}
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Right Content Area - Full Height & Width */}
            <main className="flex-1 relative h-full overflow-y-auto">
                {/* Background & Overlay */}
                <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center bg-no-repeat fixed" />
                <div className="absolute inset-0 bg-black/40 fixed" />

                {/* Content */}
                <div className="relative z-10 p-12 text-white min-h-full">
                    {/* Header inside content area for consistent access */}
                    <div className="absolute top-6 right-6 z-50">
                        <Header />
                    </div>

                    <div className="max-w-4xl mx-auto pt-16">
                        {activeTab === "general" && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-3xl font-bold mb-8 text-white">{t("settings.global_settings")}</h2>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-xl">
                                    <label className="block text-sm font-medium mb-3 text-white/90">{t("settings.exchange_rate")}</label>
                                    <div className="flex gap-4">
                                        <Input
                                            type="number"
                                            value={localExchangeRate}
                                            onChange={(e) => setLocalExchangeRate(e.target.value)}
                                            className="border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white rounded-xl h-12 text-lg"
                                            step="0.01"
                                        />
                                        <Button onClick={handleExchangeRateUpdate} className="h-12 px-8 bg-white text-black hover:bg-white/90 rounded-xl font-medium">
                                            {t("common.save")}
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === "accounts" && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-3xl font-bold text-white">{t("settings.accounts")}</h2>
                                    <Button onClick={() => openAccountModal()} className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-10">
                                        <Plus size={18} className="mr-2" />
                                        {t("settings.add_account")}
                                    </Button>
                                </div>
                                <div className="grid gap-4">
                                    {accounts.map((acc) => (
                                        <div key={acc.id} className="flex justify-between items-center border border-white/20 p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm group">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-white/10 rounded-full text-white group-hover:bg-white/20 transition-colors">
                                                    {acc.type === 'card' ? <CreditCard size={24} /> : <Banknote size={24} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xl text-white mb-1">{acc.name}</div>
                                                    <div className="text-sm text-white/70 font-mono tracking-wide">{formatAccountBalance(acc)}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="text-white hover:bg-white/20 hover:text-white rounded-full h-10 w-10">
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-white/20 rounded-full h-10 w-10" onClick={() => handleDeleteAccount(acc.id)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeTab === "categories" && (
                            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Income Categories */}
                                <div>
                                    <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                                        <h3 className="text-2xl font-semibold text-white">{t("settings.income_categories")}</h3>
                                        <Button size="sm" variant="outline" onClick={() => openCategoryModal("income")} className="border-white/50 text-white hover:bg-white hover:text-black bg-transparent rounded-full">
                                            <Plus size={16} className="mr-2" />
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {incomeCategories.map((cat) => (
                                            <div key={cat.id} className="flex justify-between items-center p-4 border border-white/20 rounded-xl hover:bg-white/10 bg-white/5 backdrop-blur-sm transition-colors group">
                                                <span className="font-medium text-white text-lg">{cat.name}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {cat.userId && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20 rounded-full" onClick={() => openCategoryModal("income", cat)}>
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-white/20 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
                                                                <Trash2 size={16} />
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
                                    <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                                        <h3 className="text-2xl font-semibold text-white">{t("settings.expense_categories")}</h3>
                                        <Button size="sm" variant="outline" onClick={() => openCategoryModal("expense")} className="border-white/50 text-white hover:bg-white hover:text-black bg-transparent rounded-full">
                                            <Plus size={16} className="mr-2" />
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {expenseCategories.map((cat) => (
                                            <div key={cat.id} className="flex justify-between items-center p-4 border border-white/20 rounded-xl hover:bg-white/10 bg-white/5 backdrop-blur-sm transition-colors group">
                                                <div>
                                                    <div className="font-medium text-white text-lg">{cat.name}</div>
                                                    {cat.budgetLimit && <div className="text-sm text-white/70 mt-1">{t("budget.limit")}: {cat.budgetLimit}</div>}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {cat.userId && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20 rounded-full" onClick={() => openCategoryModal("expense", cat)}>
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-white/20 rounded-full" onClick={() => handleDeleteCategory(cat.id)}>
                                                                <Trash2 size={16} />
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
                                <h2 className="text-3xl font-bold mb-8 text-white">Appearance</h2>
                                <div className="space-y-6 max-w-xl">
                                    <div className="flex items-center justify-between p-6 border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm">
                                        <div className="flex items-center gap-4 text-white">
                                            {theme === "light" ? <Sun size={24} /> : <Moon size={24} />}
                                            <span className="font-medium text-lg">Theme</span>
                                        </div>
                                        <div className="flex bg-white/10 rounded-full p-1.5">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${theme === "light" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/20"}`}
                                            >
                                                Light
                                            </button>
                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${theme === "dark" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/20"}`}
                                            >
                                                Dark
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-6 border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm">
                                        <div className="flex items-center gap-4 text-white">
                                            <Globe size={24} />
                                            <span className="font-medium text-lg">Language</span>
                                        </div>
                                        <div className="flex bg-white/10 rounded-full p-1.5">
                                            <button
                                                onClick={() => setLanguage("en")}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${language === "en" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/20"}`}
                                            >
                                                EN
                                            </button>
                                            <button
                                                onClick={() => setLanguage("ukr")}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${language === "ukr" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/20"}`}
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
