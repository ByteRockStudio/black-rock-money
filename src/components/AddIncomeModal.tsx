"use client";

import { useState, useEffect, useRef } from "react";
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

    // Shared input classes for dual-theme
    const inputClasses = `w-full rounded-lg px-4 py-3 text-sm transition-all
        bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:ring-white
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

    const selectClasses = `w-full rounded-lg px-4 py-3 text-sm transition-all
        bg-zinc-50 border border-zinc-200 text-zinc-900
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-white`;

    const labelClasses = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider";

    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {t("add.income_title") || "Add Income"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount & Currency Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>{t("add.amount") || "Amount"}</label>
                        <input
                            ref={amountInputRef}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>{t("add.currency") || "Currency"}</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className={selectClasses}
                        >
                            <option value="UAH">UAH</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>

                {/* Account */}
                <div>
                    <label className={labelClasses}>{t("add.destination") || "Destination Account"}</label>
                    <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        required
                        className={selectClasses}
                    >
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} ({isPrivacyEnabled ? "***" : `${acc.balance} ${acc.currency}`})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category */}
                <div>
                    <label className={labelClasses}>{t("add.source_category") || "Income Source"}</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                        className={selectClasses}
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Comment */}
                <div>
                    <label className={labelClasses}>{t("add.comment") || "Comment"}</label>
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Optional note..."
                        className={inputClasses}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 text-sm font-semibold rounded-lg transition-colors
                            bg-emerald-600 text-white hover:bg-emerald-700
                            dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
                    >
                        {t("add.submit_income") || "Add Income"}
                    </button>
                </div>
            </form>
        </div>
    );
}
