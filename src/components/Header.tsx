"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Moon, Sun, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SummaryData {
    totalBalance: Record<string, number>;
    monthlyStats: Record<string, { income: number; expense: number }>;
}

import { usePathname } from "next/navigation";

export function Header() {
    const { theme, setTheme, language, setLanguage, exchangeRate, t } = useSettings();
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
        // Simple formatter
        const symbol = currency === "UAH" ? "₴" : currency === "USD" ? "$" : currency;
        return `${symbol}${amount.toLocaleString()}`;
    };

    // Calculate total balance in UAH
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

    const isSettingsPage = pathname === '/settings';

    return (
        <header className="w-full p-8 flex flex-col items-center gap-6">
            {/* Settings Controls (Top Right) */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
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
                <div className="flex flex-col items-center gap-4 mt-4 w-full">
                    {data ? (
                        <div className="flex items-center justify-center gap-16 w-full max-w-4xl">
                            {/* Monthly Income (Left) */}
                            <div className="flex flex-col items-center w-40">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Income</span>
                                <span className="text-2xl font-light">
                                    {formatCurrency(data.monthlyStats["UAH"]?.income || 0, "UAH")}
                                </span>
                            </div>

                            {/* Total Balance (Center) - in UAH */}
                            <div className="flex flex-col items-center w-40">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{t("header.balance")}</span>
                                <div className="text-2xl font-light">
                                    {formatCurrency(calculateTotalBalanceUAH(), "UAH")}
                                </div>
                            </div>

                            {/* Monthly Expenses (Right) */}
                            <div className="flex flex-col items-center w-40">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Expenses</span>
                                <span className="text-2xl font-light">
                                    {formatCurrency(data.monthlyStats["UAH"]?.expense || 0, "UAH")}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">...</span>
                    )}
                </div>
            )}
        </header>
    );
}
