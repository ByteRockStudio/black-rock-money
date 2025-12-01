"use client";

import { format } from "date-fns";
import { Edit2, Trash2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    type: string;
    date: string;
    comment?: string;
    isRecurring?: boolean;
    category: {
        name: string;
    };
    account: {
        name: string;
    };
}

interface TransactionRowProps {
    transaction: Transaction;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

export function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
    const { t } = useSettings();
    const isIncome = transaction.type === "income";
    const isRecurring = transaction.isRecurring;

    return (
        <div
            className={`w-full bg-white/5 border-b border-white/10 p-4 flex justify-between items-center hover:bg-white/10 transition group
            ${isRecurring ? "border-l-4 border-l-purple-500" : ""}
            `}
        >
            {/* Left: Date & Category */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-white font-medium text-lg">{transaction.category.name}</span>
                    <span className="text-white/50 text-sm">
                        {format(new Date(transaction.date), "dd MMM yyyy")} • {transaction.account.name}
                    </span>
                </div>
            </div>

            {/* Middle: Comment (Optional) */}
            {transaction.comment && (
                <div className="hidden md:block text-white/40 text-sm italic truncate max-w-[200px]">
                    {transaction.comment}
                </div>
            )}

            {/* Right: Amount & Actions */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span
                        className={`text-xl font-bold ${isIncome ? "text-green-400" : "text-white"
                            }`}
                    >
                        {isIncome ? "+" : "-"}{transaction.amount} {transaction.currency}
                    </span>
                    {isRecurring && (
                        <span className="text-purple-400 text-xs flex items-center gap-1">
                            <Repeat size={12} /> Recurring
                        </span>
                    )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                    >
                        <Edit2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(transaction.id)}
                        className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-400/20"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
