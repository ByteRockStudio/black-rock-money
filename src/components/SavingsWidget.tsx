"use client";

import { useEffect, useState } from "react";
import { PiggyBank } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { PrivacyMask } from "@/components/PrivacyMask";

interface Account {
    id: string;
    balance: number;
    currency: string;
    isSavings: boolean;
}

export function SavingsWidget() {
    const { exchangeRate } = useSettings();
    const { isPrivacyEnabled } = usePrivacy();
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        // Fetch accounts directly
        fetch("/api/accounts")
            .then((res) => res.json())
            .then((data) => setAccounts(data));
    }, []);

    // Filter savings accounts
    const savingsAccounts = accounts.filter((acc) => acc.isSavings);

    // Calculate totals
    let totalUSD = 0;
    let totalUAH = 0;

    savingsAccounts.forEach((acc) => {
        if (acc.currency === "USD") {
            totalUSD += acc.balance;
            totalUAH += acc.balance * exchangeRate;
        } else if (acc.currency === "UAH") {
            totalUAH += acc.balance;
            totalUSD += acc.balance / exchangeRate;
        }
        // Add more currencies if needed
    });

    // Don't render if no savings accounts (optional, but good for cleanliness)
    if (savingsAccounts.length === 0) return null;

    return (
        <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            {/* Icon */}
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <PiggyBank size={14} />
            </div>

            {/* Text Content */}
            <div className="flex items-baseline gap-2">
                {/* Primary: USD */}
                <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <PrivacyMask value={`$ ${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                </span>

                {/* Secondary: UAH */}
                <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                    (<PrivacyMask value={`${totalUAH.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₴`} />)
                </span>
            </div>
        </div>
    );
}
