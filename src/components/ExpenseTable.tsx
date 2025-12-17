"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PrivacyMask } from "@/components/PrivacyMask";

import { useSettings } from "@/contexts/SettingsContext";

interface ExpenseTableProps {
    onClose: () => void;
}

export function ExpenseTable({ onClose }: ExpenseTableProps) {
    const { t } = useSettings();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filter, setFilter] = useState("month"); // month, week, day

    useEffect(() => {
        fetch("/api/transactions")
            .then((res) => res.json())
            .then((data) => setTransactions(data));
    }, []);

    const filteredTransactions = transactions.filter((t) => {
        // Simple filter logic for demo
        return true;
    });

    const totalSpent = filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t("view.title")}</h2>
                <div className="text-xl font-bold">
                    <span className="mr-2">{t("view.total")}:</span>
                    <PrivacyMask value={totalSpent.toFixed(2)} />
                </div>
            </div>

            <div className="flex space-x-2 mb-4">
                <button
                    onClick={() => setFilter("month")}
                    className={`px-3 py-1 rounded ${filter === "month" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                    {t("view.filter.month")}
                </button>
                <button
                    onClick={() => setFilter("week")}
                    className={`px-3 py-1 rounded ${filter === "week" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                    {t("view.filter.week")}
                </button>
                <button
                    onClick={() => setFilter("day")}
                    className={`px-3 py-1 rounded ${filter === "day" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                    {t("view.filter.day")}
                </button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">{t("add.category")}</th>
                            <th className="px-4 py-2">{t("add.amount")}</th>
                            <th className="px-4 py-2">{t("add.source")}</th>
                            <th className="px-4 py-2">{t("add.comment")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((t) => (
                            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="px-4 py-2">{format(new Date(t.date), "yyyy-MM-dd")}</td>
                                <td className="px-4 py-2">{t.category?.name}</td>
                                <td className="px-4 py-2 font-medium">
                                    <PrivacyMask value={`${t.type === "expense" ? "-" : "+"}${t.amount.toFixed(2)}`} />
                                </td>
                                <td className="px-4 py-2">{t.account?.name}</td>
                                <td className="px-4 py-2 text-muted-foreground">{t.comment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
