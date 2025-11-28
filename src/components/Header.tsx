"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SummaryData {
    totalBalance: Record<string, number>;
    monthlyStats: Record<string, { income: number; expense: number }>;
}

export function Header() {
    const { theme, setTheme, language, setLanguage, t } = useSettings();
    const [data, setData] = useState<SummaryData | null>(null);

    useEffect(() => {
        fetchSummary();
    }, []);

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
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col items-center gap-4 mt-4">
                <div className="flex items-center gap-8 text-lg font-light tracking-wide">
                    {data ? (
                        Object.entries(data.monthlyStats).map(([currency, stats]) => (
                            <div key={currency} className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Income</span>
                                    <span className="text-green-500 font-medium">+{formatCurrency(stats.income, currency)}</span>
                                </div>
                                <div className="h-8 w-px bg-border/50"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Expenses</span>
                                    <span className="text-red-500 font-medium">-{formatCurrency(stats.expense, currency)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <span className="text-muted-foreground">...</span>
                    )}
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{t("header.balance")}</span>
                    <div className="text-4xl font-light flex gap-6">
                        {data ? (
                            Object.entries(data.totalBalance).map(([currency, amount]) => (
                                <span key={currency}>{formatCurrency(amount, currency)}</span>
                            ))
                        ) : (
                            <span>...</span>
                        )}
                        {data && Object.keys(data.totalBalance).length === 0 && <span>0</span>}
                    </div>
                </div>
            </div>
        </header>
    );
}
