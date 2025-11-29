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
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
            <Header />
            <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium">{t("common.close")}</span>
                    </Link>
                </div>

                <h1 className="text-5xl font-hard-rock mb-12 tracking-wide">{t("settings.title")}</h1>

                <div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0 border-r border-border pr-6">
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? "bg-foreground text-background"
                                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 relative rounded-[40px] overflow-hidden shadow-xl min-h-[600px]">
                        {/* Background & Overlay */}
                        <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center bg-no-repeat" />
                        <div className="absolute inset-0 bg-black/40" />

                        {/* Content */}
                        <div className="relative z-10 p-8 text-white h-full">
                            {activeTab === "general" && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 text-white">{t("settings.global_settings")}</h2>
                                    <div className="max-w-md">
                                        <label className="block text-sm font-medium mb-2 text-white/90">{t("settings.exchange_rate")}</label>
                                        <div className="flex gap-4">
                                            <Input
                                                type="number"
                                                value={localExchangeRate}
                                                onChange={(e) => setLocalExchangeRate(e.target.value)}
                                                className="border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white rounded-md h-11"
                                                step="0.01"
                                            />
                                            <Button onClick={handleExchangeRateUpdate} className="h-11 px-6 bg-white text-black hover:bg-white/90">
                                                {t("common.save")}
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "accounts" && (
                                <section>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-white">{t("settings.accounts")}</h2>
                                        <Button onClick={() => openAccountModal()} className="bg-white text-black hover:bg-white/90">
                                            <Plus size={16} className="mr-2" />
                                            {t("settings.add_account")}
                                        </Button>
                                    </div>
                                    <div className="grid gap-4">
                                        {accounts.map((acc) => (
                                            <div key={acc.id} className="flex justify-between items-center border border-white/20 p-5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/10 rounded-full text-white">
                                                        {acc.type === 'card' ? <CreditCard size={20} /> : <Banknote size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-lg text-white">{acc.name}</div>
                                                        <div className="text-sm text-white/70 font-mono">{formatAccountBalance(acc)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openAccountModal(acc)} className="text-white hover:bg-white/20 hover:text-white">
                                                        <Edit2 size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-white/20" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeTab === "categories" && (
                                <section className="space-y-12">
                                    {/* Income Categories */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                            <h3 className="text-xl font-semibold text-white">{t("settings.income_categories")}</h3>
                                            <Button size="sm" variant="outline" onClick={() => openCategoryModal("income")} className="border-white/50 text-white hover:bg-white hover:text-black bg-transparent">
                                                <Plus size={14} className="mr-2" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {incomeCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border border-white/20 rounded-md hover:bg-white/10 bg-white/5">
                                                    <span className="font-medium text-white">{cat.name}</span>
                                                    <div className="flex gap-1">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => openCategoryModal("income", cat)}>
                                                                    <Edit2 size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-white/20" onClick={() => handleDeleteCategory(cat.id)}>
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
                                            <Button size="sm" variant="outline" onClick={() => openCategoryModal("expense")} className="border-white/50 text-white hover:bg-white hover:text-black bg-transparent">
                                                <Plus size={14} className="mr-2" />
                                                {t("common.add")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {expenseCategories.map((cat) => (
                                                <div key={cat.id} className="flex justify-between items-center p-3 border border-white/20 rounded-md hover:bg-white/10 bg-white/5">
                                                    <div>
                                                        <div className="font-medium text-white">{cat.name}</div>
                                                        {cat.budgetLimit && <div className="text-xs text-white/70">{t("budget.limit")}: {cat.budgetLimit}</div>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {cat.userId && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => openCategoryModal("expense", cat)}>
                                                                    <Edit2 size={14} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-white/20" onClick={() => handleDeleteCategory(cat.id)}>
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
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 text-white">Appearance</h2>
                                    <div className="space-y-6 max-w-md">
                                        <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-3 text-white">
                                                {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
                                                <span className="font-medium">Theme</span>
                                            </div>
                                            <div className="flex bg-white/10 rounded-full p-1">
                                                <button
                                                    onClick={() => setTheme("light")}
                                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${theme === "light" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/20"}`}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    onClick={() => setTheme("dark")}
                                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${theme === "dark" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/20"}`}
                                                >
                                                    Dark
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-3 text-white">
                                                <Globe size={20} />
                                                <span className="font-medium">Language</span>
                                            </div>
                                            <div className="flex bg-white/10 rounded-full p-1">
                                                <button
                                                    onClick={() => setLanguage("en")}
                                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${language === "en" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/20"}`}
                                                >
                                                    EN
                                                </button>
                                                <button
                                                    onClick={() => setLanguage("ukr")}
                                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${language === "ukr" ? "bg-white text-black shadow-sm" : "text-white hover:bg-white/20"}`}
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
