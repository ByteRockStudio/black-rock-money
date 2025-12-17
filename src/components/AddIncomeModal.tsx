"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";

interface AddIncomeModalProps {
    onClose: () => void;
}

export function AddIncomeModal({ onClose }: AddIncomeModalProps) {
    useCloseOnEscape(onClose);
    const { t } = useSettings();
    const { isPrivacyEnabled } = usePrivacy();
    const amountInputRef = useRef<HTMLInputElement>(null);
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("UAH");
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [comment, setComment] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // Auto-focus on amount input
        amountInputRef.current?.focus();

        fetch("/api/accounts")
            .then((res) => res.json())
            .then((data) => {
                setAccounts(data);
                if (data.length > 0) {
                    const defaultAccount = data.find((acc: any) => acc.isDefault);
                    setAccountId(defaultAccount ? defaultAccount.id : data[0].id);
                }
            });

        fetch("/api/categories?type=INCOME")
            .then((res) => res.json())
            .then((data) => {
                setCategories(data);
                if (data.length > 0) setCategoryId(data[0].id);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount,
                currency,
                accountId,
                categoryId,
                comment,
                type: "income",
            }),
        });
        onClose();
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">{t("add.income_title")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label>{t("add.amount")}</label>
                        <Input
                            ref={amountInputRef}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label>{t("add.currency")}</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="UAH">UAH</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label>{t("add.destination")}</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        required
                    >
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} {t("common.balance_wrapper", {
                                    balance: isPrivacyEnabled ? "***" : `${acc.balance} ${acc.currency}`
                                })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label>{t("add.source_category")}</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label>{t("add.comment")}</label>
                    <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">{t("add.submit_income")}</Button>
                </div>
            </form>
        </div>
    );
}
