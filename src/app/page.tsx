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
import Link from "next/link";

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
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="relative h-[65vh] w-[80%] mx-auto rounded-[40px] overflow-hidden shadow-2xl">
                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 bg-[url('/img/back.jpg')] bg-cover bg-center bg-no-repeat" />
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-white py-10 px-10">
                        <h1 className="text-6xl font-hard-rock tracking-wide mb-16 text-white drop-shadow-lg">{t("app.title")}</h1>

                        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                            <CircleButton
                                icon={<Plus size={32} />}
                                label={t("nav.add")}
                                onClick={() => setActiveModule("add")}
                                className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                            />
                            <CircleButton
                                icon={<Plus size={32} className="text-green-400" />}
                                label={t("nav.income")}
                                onClick={() => setActiveModule("income")}
                                className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                            />
                            <CircleButton
                                icon={<List size={32} />}
                                label={t("nav.view")}
                                onClick={() => setActiveModule("view")}
                                className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                            />
                            <CircleButton
                                icon={<PieChart size={32} />}
                                label={t("nav.budget")}
                                onClick={() => setActiveModule("budget")}
                                className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                            />
                            <CircleButton
                                icon={<Repeat size={32} />}
                                label={t("nav.recurring")}
                                onClick={() => setActiveModule("recurring")}
                                className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                            />
                            <Link href="/settings">
                                <CircleButton
                                    icon={<Settings size={32} />}
                                    label={t("nav.settings")}
                                    onClick={() => { }}
                                    className="border-white/50 text-white hover:bg-white hover:text-black hover:border-white"
                                />
                            </Link>
                        </div>
                    </div>
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

function CircleButton({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 transition-all duration-300 group ${className || "border-primary hover:bg-primary hover:text-primary-foreground"}`}
        >
            <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
