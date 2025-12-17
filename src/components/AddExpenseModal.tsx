"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useSettings } from "@/contexts/SettingsContext";
import { useCloseOnEscape } from "@/lib/hooks/useCloseOnEscape";

interface AddExpenseModalProps {
    onClose: () => void;
    initialData?: any;
}

// Helper to format date for input[type="date"]
const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return format(new Date(), "yyyy-MM-dd");
    return format(new Date(date), "yyyy-MM-dd");
};

export function AddExpenseModal({ onClose, initialData }: AddExpenseModalProps) {
    useCloseOnEscape(onClose);
    const { t } = useSettings();
    const amountInputRef = useRef<HTMLInputElement>(null);
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [currency, setCurrency] = useState(initialData?.currency || "UAH");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [comment, setComment] = useState(initialData?.comment || "");
    const [transactionDate, setTransactionDate] = useState(formatDateForInput(initialData?.date));
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // Auto-focus on amount input
        amountInputRef.current?.focus();

        fetch("/api/accounts")
            .then((res) => res.json())
            .then((data) => {
                setAccounts(data);
                if (!initialData && data.length > 0) {
                    const defaultAccount = data.find((acc: any) => acc.isDefault);
                    setAccountId(defaultAccount ? defaultAccount.id : data[0].id);
                }
            });

        fetch("/api/categories?type=EXPENSE")
            .then((res) => res.json())
            .then((data) => {
                setCategories(data);
                if (!initialData && data.length > 0) setCategoryId(data[0].id);
            });
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = initialData ? "/api/transactions" : "/api/transactions";
        const method = initialData ? "PUT" : "POST";
        const body = {
            id: initialData?.id, // Only for PUT
            amount,
            currency,
            accountId,
            categoryId,
            comment,
            date: transactionDate, // ISO date string
            type: initialData?.type || "expense", // Preserve type if editing, default to expense
        };

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        onClose();
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">{initialData ? "Edit Transaction" : t("add.title")}</h2>
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
                    <label>{t("add.source")}</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        required
                    >
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.balance} {acc.currency})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label>{t("add.category")}</label>
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

                {/* Date Field */}
                <div className="space-y-2">
                    <label>Date</label>
                    <Input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">{t("add.submit")}</Button>
                </div>
            </form>
        </div>
    );
}
