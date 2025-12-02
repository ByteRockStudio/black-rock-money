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
        <tr className={`h-12 border-b border-gray-100 dark:border-white/10 transition-colors group text-sm ${isRecurring ? "bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
            {/* Date */}
            <td className="px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {format(new Date(transaction.date), "dd MMM yyyy")}
            </td>

            {/* Category */}
            <td className="px-4 font-medium text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                    {transaction.category.name}
                    {isRecurring && (
                        <Repeat size={12} className="text-purple-500" />
                    )}
                </div>
            </td>

            {/* Account */}
            <td className="px-4 text-gray-500 dark:text-gray-400">
                {transaction.account.name}
            </td>

            {/* Comment */}
            <td className="px-4 text-gray-400 dark:text-gray-500 italic truncate max-w-[200px]">
                {transaction.comment}
            </td>

            {/* Amount */}
            <td className={`px-4 text-right font-medium ${isIncome ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                {isIncome ? "+" : "-"}{transaction.amount} {transaction.currency}
            </td>

            {/* Actions */}
            <td className="px-4 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                        className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <Edit2 size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(transaction.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
