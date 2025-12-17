"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrivacyMask } from "@/components/PrivacyMask";
import { Trash2 } from "lucide-react";

import { useSettings } from "@/contexts/SettingsContext";

interface SettingsViewProps {
    onClose: () => void;
}

export function SettingsView({ onClose }: SettingsViewProps) {
    const { t } = useSettings();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountBalance, setNewAccountBalance] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryLimit, setNewCategoryLimit] = useState("");

    useEffect(() => {
        fetchAccounts();
        fetchCategories();
    }, []);

    const fetchAccounts = () => {
        fetch("/api/accounts")
            .then((res) => res.json())
            .then((data) => setAccounts(data));
    };

    const fetchCategories = () => {
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data));
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newAccountName,
                type: "card",
                balance: newAccountBalance,
                currency: "UAH",
            }),
        });

        if (res.ok) {
            fetchAccounts();
            setNewAccountName("");
            setNewAccountBalance("");
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newCategoryName,
                budgetLimit: newCategoryLimit,
            }),
        });

        if (res.ok) {
            fetchCategories();
            setNewCategoryName("");
            setNewCategoryLimit("");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm(t("settings.confirm_delete_category"))) return;

        const res = await fetch(`/api/categories?id=${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchCategories();
        } else {
            alert(t("settings.delete_category_failed"));
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t("settings.title")}</h2>

                {/* Accounts Section */}
                <section className="mb-8">
                    <h3 className="text-lg font-medium mb-2">{t("settings.accounts")}</h3>
                    <div className="grid gap-4 mb-4">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="flex justify-between items-center border p-4 rounded-lg">
                                <div>
                                    <div className="font-medium">{acc.name}</div>
                                    <div className="text-sm text-muted-foreground">{acc.type}</div>
                                </div>
                                <div className="font-bold">
                                    <PrivacyMask value={`${acc.balance} ${acc.currency}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleCreateAccount} className="space-y-4 border p-4 rounded-lg">
                        <h4 className="font-medium">{t("settings.add_account")}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder={t("settings.account_name")}
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                required
                            />
                            <Input
                                type="number"
                                placeholder={t("settings.initial_balance")}
                                value={newAccountBalance}
                                onChange={(e) => setNewAccountBalance(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit">{t("common.add")}</Button>
                    </form>
                </section>

                {/* Categories Section */}
                <section>
                    <h3 className="text-lg font-medium mb-2">{t("settings.categories")}</h3>
                    <div className="grid gap-4 mb-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex justify-between items-center border p-4 rounded-lg">
                                <div>
                                    <div className="font-medium">{cat.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {t("budget.limit")}: {cat.budgetLimit || "None"}
                                    </div>
                                </div>
                                {cat.userId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 size={20} />
                                    </Button>
                                )}
                                {!cat.userId && (
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{t("common.system")}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleCreateCategory} className="space-y-4 border p-4 rounded-lg">
                        <h4 className="font-medium">{t("settings.add_category")}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder={t("settings.category_name")}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                required
                            />
                            <Input
                                type="number"
                                placeholder={t("settings.budget_limit")}
                                value={newCategoryLimit}
                                onChange={(e) => setNewCategoryLimit(e.target.value)}
                            />
                        </div>
                        <Button type="submit">{t("common.add")}</Button>
                    </form>
                </section>
            </div>
        </div>
    );
}
