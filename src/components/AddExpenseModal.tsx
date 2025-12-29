"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
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
    const { isPrivacyEnabled } = usePrivacy();
    const amountInputRef = useRef<HTMLInputElement>(null);
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [currency, setCurrency] = useState(initialData?.currency || "UAH");
    const [accountId, setAccountId] = useState(initialData?.accountId || "");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [comment, setComment] = useState(initialData?.comment || "");
    const [transactionDate, setTransactionDate] = useState(formatDateForInput(initialData?.date));
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const isEditing = !!initialData;

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

        const url = "/api/transactions";
        const method = initialData ? "PUT" : "POST";
        const body = {
            id: initialData?.id,
            amount,
            currency,
            accountId,
            categoryId,
            comment,
            date: transactionDate,
            type: initialData?.type || "expense",
        };

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        onClose();
    };

    // Shared input classes for dual-theme
    const inputClasses = `w-full rounded-lg px-4 py-3 text-sm transition-all
        bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:ring-white
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

    const selectClasses = `w-full rounded-lg px-4 py-3 pr-10 text-sm transition-all appearance-none cursor-pointer
        bg-zinc-50 border border-zinc-200 text-zinc-900
        focus:outline-none focus:ring-2 focus:ring-black
        dark:bg-[#111111] dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-white`;

    const labelClasses = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider";

    // Custom select wrapper component
    const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="relative">
            {children}
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {isEditing ? "Edit Transaction" : t("add.title") || "Add Expense"}
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
                        <SelectWrapper>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className={selectClasses}
                            >
                                <option value="UAH">UAH</option>
                                <option value="USD">USD</option>
                            </select>
                        </SelectWrapper>
                    </div>
                </div>

                {/* Account */}
                <div>
                    <label className={labelClasses}>{t("add.source") || "Account"}</label>
                    <SelectWrapper>
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
                    </SelectWrapper>
                </div>

                {/* Category */}
                <div>
                    <label className={labelClasses}>{t("add.category") || "Category"}</label>
                    <SelectWrapper>
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
                    </SelectWrapper>
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

                {/* Date */}
                <div>
                    <label className={labelClasses}>Date</label>
                    <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                        className={`${inputClasses} dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-60`}
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
                            bg-black text-white hover:bg-zinc-800
                            dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                        {isEditing ? "Save Changes" : (t("add.submit") || "Add Expense")}
                    </button>
                </div>
            </form>
        </div>
    );
}
