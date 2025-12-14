"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, List, PieChart, Repeat, Settings } from "lucide-react";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { AddIncomeModal } from "@/components/AddIncomeModal";
import { ExpenseTable } from "@/components/ExpenseTable";
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
            case "recurring":
                return <RecurringView onClose={() => setActiveModule(null)} />;
            default:
                return null;
        }
    };

    const navItems = [
        { icon: <Plus size={24} />, label: t("nav.add"), onClick: () => setActiveModule("add"), accent: "text-red-500" },
        { icon: <Plus size={24} />, label: t("nav.income"), onClick: () => setActiveModule("income"), accent: "text-green-500" },
        { icon: <List size={24} />, label: t("nav.view"), href: "/transactions" },
        { icon: <PieChart size={24} />, label: t("nav.budget"), href: "/budget" },
        { icon: <Repeat size={24} />, label: t("nav.recurring"), href: "/recurring" },
        { icon: <Settings size={24} />, label: t("nav.settings"), href: "/settings" },
    ];

    return (
        <div className="h-full w-full font-sans overflow-hidden relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10">
                <Header />
            </div>

            {/* Main Content */}
            <main className="absolute top-[180px] left-0 right-0 bottom-0 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-8 py-12">
                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-hard-rock tracking-wide mb-16 text-center text-zinc-900 dark:text-white">
                        {t("app.title")}
                    </h1>

                    {/* Navigation Grid - Minimalist Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {navItems.map((item, index) => {
                            const CardContent = (
                                <div className="group flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-300 cursor-pointer
                                    bg-white dark:bg-zinc-900/50 
                                    hover:bg-zinc-50 dark:hover:bg-zinc-800/70
                                    border border-zinc-200 dark:border-zinc-800
                                    hover:border-zinc-300 dark:hover:border-zinc-700
                                    hover:shadow-lg dark:hover:shadow-zinc-900/50
                                    ">
                                    <div className={`mb-4 p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform ${item.accent || "text-zinc-700 dark:text-zinc-300"}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        {item.label}
                                    </span>
                                </div>
                            );

                            if (item.href) {
                                return (
                                    <Link key={index} href={item.href}>
                                        {CardContent}
                                    </Link>
                                );
                            }

                            return (
                                <div key={index} onClick={item.onClick}>
                                    {CardContent}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Overlay */}
                {activeModule && (
                    <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto relative">
                            <button
                                onClick={() => setActiveModule(null)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
