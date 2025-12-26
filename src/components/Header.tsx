
"use client";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Moon, Sun, Globe, LogOut, Eye, EyeOff, ArrowDown, ArrowUp, Wallet, PiggyBank } from "lucide-react";
import { PrivacyMask } from "@/components/PrivacyMask";
import { Button } from "@/components/ui/button";

import { MetricPill } from "@/components/MetricPill";
import { usePathname } from "next/navigation";

interface SummaryData {
    totalBalance: Record<string, number>;
    savingsBalance: Record<string, number>;
    monthlyStats: Record<string, { income: number; expense: number }>;
}

export function Header() {
    const { theme, setTheme, language, setLanguage, exchangeRate, t } = useSettings();
    const { isPrivacyEnabled, togglePrivacy } = usePrivacy();
    const [data, setData] = useState<SummaryData | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        if (pathname !== '/settings') {
            fetchSummary();
        }
    }, [pathname]);

    const fetchSummary = async () => {
        try {
            const res = await fetch("/api/summary");
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            }
        } catch (error) {
            console.error("Failed to fetch summary", error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "ukr" : "en");
    };

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currency === "UAH" ? "₴" : currency === "USD" ? "$" : currency;
        return `${symbol}${amount.toLocaleString()}`;
    };

    // Calculate total balance in UAH (Operating Capital)
    const calculateTotalBalanceUAH = () => {
        if (!data) return 0;
        let total = 0;
        Object.entries(data.totalBalance).forEach(([currency, amount]) => {
            if (currency === "USD") {
                total += amount * exchangeRate;
            } else {
                total += amount;
            }
        });
        return total;
    };

    // Calculate Savings Balance (Primary: USD, Secondary: UAH)
    // The requirement says: "Item 4: Savings... Display in ... USD (primary) and UAH (secondary)"
    // The API returns savingsBalance: { "USD": 123, "UAH": 456 }
    const calculateSavings = () => {
        if (!data || !data.savingsBalance) return { usd: 0, uah: 0 };

        let totalUSD = 0;
        let totalUAH = 0;

        // We want strict total in USD and strict total in UAH (converted)
        // Similar logic to SavingsWidget: 
        // Total USD = S_USD + S_UAH / Rate
        // Total UAH = S_UAH + S_USD * Rate

        const s_usd = data.savingsBalance["USD"] || 0;
        const s_uah = data.savingsBalance["UAH"] || 0;

        totalUSD = s_usd + (s_uah / exchangeRate);
        totalUAH = s_uah + (s_usd * exchangeRate);

        return { usd: totalUSD, uah: totalUAH };
    };

    const isSettingsPage = pathname === '/settings';
    const savings = calculateSavings();

    return (
        <header className="w-full p-8 flex flex-col items-center gap-6">
            {/* Settings Controls (Top Right) */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
                {/* SavingsWidget removed from here */}
                <Button variant="ghost" size="icon" onClick={togglePrivacy} title={isPrivacyEnabled ? "Show Balances" : "Hide Balances"} className="rounded-full">
                    {isPrivacyEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Switch Language" className="rounded-full">
                    <span className="font-medium text-xs">{language.toUpperCase()}</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme" className="rounded-full">
                    {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    title="Logout"
                    className="rounded-full text-neutral-700 hover:text-red-600 dark:text-white dark:hover:text-red-400 transition-colors duration-200"
                >
                    <LogOut size={18} />
                </Button>
            </div>

            {/* Financial Summary - Hide on Settings Page */}
            {!isSettingsPage && (
                <div className="w-full max-w-5xl mx-auto mt-10 mb-8">
                    {data ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">

                            {/* 1. Total Balance (Operating) */}
                            <MetricPill
                                label={t("header.balance")}
                                amount={calculateTotalBalanceUAH()}
                                currency="UAH"
                                icon={Wallet}
                                color="zinc"
                            />

                            {/* 2. Income */}
                            <MetricPill
                                label="Income"
                                amount={data.monthlyStats["UAH"]?.income || 0}
                                currency="UAH"
                                icon={ArrowDown}
                                color="emerald"
                            />

                            {/* 3. Expenses */}
                            <MetricPill
                                label="Expenses"
                                amount={data.monthlyStats["UAH"]?.expense || 0}
                                currency="UAH"
                                icon={ArrowUp}
                                color="rose"
                            />

                            {/* 4. Savings (New Location) */}
                            <MetricPill
                                label="Savings"
                                amount={savings.usd}
                                currency="USD"
                                amountSecondary={savings.uah}
                                currencySecondary="UAH"
                                icon={PiggyBank}
                                color="violet"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <span className="text-muted-foreground">Loading...</span>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
