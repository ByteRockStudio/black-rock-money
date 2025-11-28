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
            <div className="flex flex-col items-center gap-4 mt-4 w-full">
                {data ? (
                    Object.keys(data.totalBalance).map((currency) => {
                        const balance = data.totalBalance[currency] || 0;
                        const stats = data.monthlyStats[currency] || { income: 0, expense: 0 };

                        return (
                            <div key={currency} className="flex items-center justify-center gap-16 w-full max-w-4xl">
                                {/* Monthly Income (Left) */}
                                <div className="flex flex-col items-center w-40">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Income</span>
                                    <span className="text-2xl font-light">{formatCurrency(stats.income, currency)}</span>
                                </div>

                                {/* Total Balance (Center) */}
                                <div className="flex flex-col items-center w-40">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{t("header.balance")}</span>
                                    <div className="text-2xl font-light">
                                        {formatCurrency(balance, currency)}
                                    </div>
                                </div>

                                {/* Monthly Expenses (Right) */}
                                <div className="flex flex-col items-center w-40">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Expenses</span>
                                    <span className="text-2xl font-light">{formatCurrency(stats.expense, currency)}</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <span className="text-muted-foreground">...</span>
                )}
                {data && Object.keys(data.totalBalance).length === 0 && (
                    <div className="flex items-center justify-center gap-16 w-full max-w-4xl">
                        <div className="flex flex-col items-center w-40">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Income</span>
                            <span className="text-2xl font-light">0</span>
                        </div>
                        <div className="flex flex-col items-center w-40">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{t("header.balance")}</span>
                            <div className="text-2xl font-light">0</div>
                        </div>
                        <div className="flex flex-col items-center w-40">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Expenses</span>
                            <span className="text-2xl font-light">0</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
