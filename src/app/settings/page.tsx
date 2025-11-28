"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, theme, setTheme, language, setLanguage, exchangeRate, setExchangeRate } = useSettings();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [localExchangeRate, setLocalExchangeRate] = useState(String(exchangeRate));

    // Account form state
    const [accountForm, setAccountForm] = useState({
        id: "",
        name: "",
        type: "card",
        startingBalance: "",
        currency: "UAH",
    });
    const [isEditingAccount, setIsEditingAccount] = useState(false);

    // Category form state
    const [categoryForm, setCategoryForm] = useState({
        id: "",
        name: "",
        type: "expense",
        budgetLimit: "",
    });
    const [isEditingCategory, setIsEditingCategory] = useState(false);

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

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = isEditingAccount ? "PUT" : "POST";
        const body = isEditingAccount
            ? { id: accountForm.id, name: accountForm.name, type: accountForm.type, currency: accountForm.currency }
            : accountForm;

        const res = await fetch("/api/accounts", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            fetchAccounts();
            resetAccountForm();
        }
    };

    const handleEditAccount = (account: Account) => {
        setAccountForm({
            id: account.id,
            name: account.name,
            type: account.type,
            startingBalance: String(account.startingBalance),
            currency: account.currency,
        });
        setIsEditingAccount(true);
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm(t("settings.confirm_delete_account"))) return;

        const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchAccounts();
        } else {
            alert(t("settings.delete_account_failed"));
        }
    };

    const resetAccountForm = () => {
        setAccountForm({ id: "", name: "", type: "card", startingBalance: "", currency: "UAH" });
        setIsEditingAccount(false);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = isEditingCategory ? "PUT" : "POST";
        const body = isEditingCategory
            ? { id: categoryForm.id, name: categoryForm.name, budgetLimit: categoryForm.budgetLimit || null }
            : categoryForm;

        const res = await fetch("/api/categories", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            fetchCategories();
            resetCategoryForm();
        }
    };

    const handleEditCategory = (category: Category) => {
        setCategoryForm({
            id: category.id,
            name: category.name,
            type: category.type,
            budgetLimit: category.budgetLimit ? String(category.budgetLimit) : "",
        });
        setIsEditingCategory(true);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm(t("settings.confirm_delete_category"))) return;

        const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchCategories();
        } else {
            alert(t("settings.delete_category_failed"));
        }
    };

    const resetCategoryForm = () => {
        setCategoryForm({ id: "", name: "", type: "expense", budgetLimit: "" });
        setIsEditingCategory(false);
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

    if (status === "loading") {
        return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                        {t("common.close")}
                    </Link>
                </div>

                <h1 className="text-4xl font-bold mb-8">{t("settings.title")}</h1>

                {/* Global Settings */}
                <section className="mb-12 border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">{t("settings.global_settings")}</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="w-48 font-medium">{t("settings.exchange_rate")}:</label>
                            <Input
                                type="number"
                                value={localExchangeRate}
                                onChange={(e) => setLocalExchangeRate(e.target.value)}
                                className="w-32"
                                step="0.01"
                            />
                            <Button onClick={handleExchangeRateUpdate}>{t("common.save")}</Button>
                        </div>
                    </div>
                </section>

                {/* Accounts Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">{t("settings.accounts")}</h2>
                    <div className="grid gap-4 mb-6">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="flex justify-between items-center border p-4 rounded-lg">
                                <div>
                                    <div className="font-medium text-lg">{acc.name}</div>
                                    <div className="text-sm text-muted-foreground">{acc.type}</div>
                                    <div className="font-bold mt-1">{formatAccountBalance(acc)}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditAccount(acc)}>
                                        <Edit2 size={20} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteAccount(acc.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 size={20} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAccountSubmit} className="border p-6 rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">
                            {isEditingAccount ? t("settings.edit") : t("settings.add_account")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder={t("settings.account_name")}
                                value={accountForm.name}
                                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                                required
                            />
                            <select
                                value={accountForm.type}
                                onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="card">{t("settings.type_card")}</option>
                                <option value="cash">{t("settings.type_cash")}</option>
                            </select>
                            {!isEditingAccount && (
                                <Input
                                    type="number"
                                    placeholder={t("settings.initial_balance")}
                                    value={accountForm.startingBalance}
                                    onChange={(e) => setAccountForm({ ...accountForm, startingBalance: e.target.value })}
                                    required
                                />
                            )}
                            <select
                                value={accountForm.currency}
                                onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="UAH">UAH</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">{isEditingAccount ? t("common.save") : t("common.add")}</Button>
                            {isEditingAccount && (
                                <Button type="button" variant="outline" onClick={resetAccountForm}>
                                    {t("common.cancel")}
                                </Button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Income Categories */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">{t("settings.income_categories")}</h2>
                    <div className="grid gap-4 mb-6">
                        {incomeCategories.map((cat) => (
                            <div key={cat.id} className="flex justify-between items-center border p-4 rounded-lg">
                                <div className="font-medium">{cat.name}</div>
                                <div className="flex gap-2">
                                    {cat.userId && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
                                                <Edit2 size={20} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 size={20} />
                                            </Button>
                                        </>
                                    )}
                                    {!cat.userId && (
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {t("common.system")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!isEditingCategory || categoryForm.type === "income") && (
                        <form onSubmit={handleCategorySubmit} className="border p-6 rounded-lg space-y-4">
                            <h3 className="font-medium text-lg">
                                {isEditingCategory ? t("settings.edit") : t("settings.add_category")}
                            </h3>
                            <Input
                                placeholder={t("settings.category_name")}
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, type: "income" })}
                                required
                            />
                            <div className="flex gap-2">
                                <Button type="submit">{isEditingCategory ? t("common.save") : t("common.add")}</Button>
                                {isEditingCategory && (
                                    <Button type="button" variant="outline" onClick={resetCategoryForm}>
                                        {t("common.cancel")}
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </section>

                {/* Expense Categories */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">{t("settings.expense_categories")}</h2>
                    <div className="grid gap-4 mb-6">
                        {expenseCategories.map((cat) => (
                            <div key={cat.id} className="flex justify-between items-center border p-4 rounded-lg">
                                <div>
                                    <div className="font-medium">{cat.name}</div>
                                    {cat.budgetLimit && (
                                        <div className="text-sm text-muted-foreground">
                                            {t("budget.limit")}: {cat.budgetLimit}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {cat.userId && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
                                                <Edit2 size={20} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 size={20} />
                                            </Button>
                                        </>
                                    )}
                                    {!cat.userId && (
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {t("common.system")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!isEditingCategory || categoryForm.type === "expense") && (
                        <form onSubmit={handleCategorySubmit} className="border p-6 rounded-lg space-y-4">
                            <h3 className="font-medium text-lg">
                                {isEditingCategory ? t("settings.edit") : t("settings.add_category")}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder={t("settings.category_name")}
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, type: "expense" })}
                                    required
                                />
                                <Input
                                    type="number"
                                    placeholder={t("settings.budget_limit")}
                                    value={categoryForm.budgetLimit}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, budgetLimit: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">{isEditingCategory ? t("common.save") : t("common.add")}</Button>
                                {isEditingCategory && (
                                    <Button type="button" variant="outline" onClick={resetCategoryForm}>
                                        {t("common.cancel")}
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
}
