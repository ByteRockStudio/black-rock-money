"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, List, PieChart, Repeat, Settings } from "lucide-react";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { AddIncomeModal } from "@/components/AddIncomeModal";
import { ExpenseTable } from "@/components/ExpenseTable";
import { BudgetView } from "@/components/BudgetView";
import { RecurringView } from "@/components/RecurringView";
import { SettingsView } from "@/components/SettingsView";

import { Header } from "@/components/Header";
import { useSettings } from "@/contexts/SettingsContext";

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const { t } = useSettings();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    const renderModule = () => {
        switch (activeModule) {
            case "add":
                return <AddExpenseModal onClose={() => setActiveModule(null)} />;
            case "income":
                return <AddIncomeModal onClose={() => setActiveModule(null)} />;
            case "view":
                return <ExpenseTable onClose={() => setActiveModule(null)} />;
            case "budget":
                return <BudgetView onClose={() => setActiveModule(null)} />;
            case "recurring":
                return <RecurringView onClose={() => setActiveModule(null)} />;
            case "settings":
                return <SettingsView onClose={() => setActiveModule(null)} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <h1 className="text-4xl font-bold mb-12">{t("app.title")}</h1>

                <div className="flex flex-wrap justify-center gap-8 md:gap-12 max-w-5xl mx-auto">
                    <CircleButton
                        icon={<Plus size={32} />}
                        label={t("nav.add")}
                        onClick={() => setActiveModule("add")}
                    />
                    <CircleButton
                        icon={<Plus size={32} className="text-green-500" />}
                        label={t("nav.income")}
                        onClick={() => setActiveModule("income")}
                    />
                    <CircleButton
                        icon={<List size={32} />}
                        label={t("nav.view")}
                        onClick={() => setActiveModule("view")}
                    />
                    <CircleButton
                        icon={<PieChart size={32} />}
                        label={t("nav.budget")}
                        onClick={() => setActiveModule("budget")}
                    />
                    <CircleButton
                        icon={<Repeat size={32} />}
                        label={t("nav.recurring")}
                        onClick={() => setActiveModule("recurring")}
                    />
                    <CircleButton
                        icon={<Settings size={32} />}
                        label={t("nav.settings")}
                        onClick={() => setActiveModule("settings")}
                    />
                </div>

                {activeModule && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card border text-card-foreground rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto relative">
                            <button
                                onClick={() => setActiveModule(null)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                {t("common.close")}
                            </button>
                            <div className="p-6">
                                {renderModule()}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function CircleButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
        >
            <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
