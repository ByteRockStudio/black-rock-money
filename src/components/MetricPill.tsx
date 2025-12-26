"use client";

import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PrivacyMask } from "./PrivacyMask";

interface MetricPillProps {
    label: string;
    amount: number;
    currency: string;
    amountSecondary?: number | null; // Optional secondary value (e.g. UAH equivalent for non-UAH primary)
    currencySecondary?: string;
    icon: LucideIcon;
    color: "emerald" | "rose" | "zinc" | "violet" | "blue" | "amber";
}

export function MetricPill({
    label,
    amount,
    currency,
    amountSecondary,
    currencySecondary = "UAH",
    icon: Icon,
    color,
}: MetricPillProps) {

    const colorMap = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
        rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
        zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    };

    // Helper to format
    const formattedPrimary = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    }).format(amount);

    const formattedSecondary = amountSecondary ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencySecondary,
        maximumFractionDigits: 0,
    }).format(amountSecondary) : null;


    return (
        <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            {/* Icon Box */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${colorMap[color]}`}>
                <Icon size={20} />
            </div>

            {/* Text */}
            <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-zinc-900 dark:text-white leading-none">
                        <PrivacyMask value={formattedPrimary} />
                    </span>
                    {formattedSecondary && (
                        <span className="text-xs font-medium text-zinc-400">
                            (<PrivacyMask value={formattedSecondary} />)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
