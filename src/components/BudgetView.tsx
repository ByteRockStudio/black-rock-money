"use client";

import { useState, useEffect } from "react";

import { useSettings } from "@/contexts/SettingsContext";

interface BudgetViewProps {
    onClose: () => void;
}

export function BudgetView({ onClose }: BudgetViewProps) {
    const { t } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // In a real app, we'd fetch categories with aggregated spent amounts
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data));
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">{t("budget.title")}</h2>
            <div className="grid gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-muted-foreground">
                                {t("budget.limit")}: {cat.budgetLimit || "None"}
                            </span>
                        </div>
                        {/* Mock progress bar */}
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary"
                                style={{ width: "40%" }} // Mock value
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{t("budget.spent")}: 0 (Mock)</span>
                            <span>{t("budget.remaining")}: {cat.budgetLimit || "∞"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
