"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useSettings } from "@/contexts/SettingsContext";
import {
    Home,
    List,
    Repeat,
    PieChart,
    Settings,
    Plus,
    Eye,
    EyeOff,
    Moon,
    Sun,
    LogOut
} from "lucide-react";
import { useState } from "react";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { AddIncomeModal } from "@/components/AddIncomeModal";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

// Export action buttons for inline use
export function GlobalActions() {
    const { theme, setTheme, privacyMode, togglePrivacy, t } = useSettings();
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddIncome, setShowAddIncome] = useState(false);

    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                    <Plus size={16} />
                    Add Transaction
                </button>

                <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1" />

                <button
                    onClick={togglePrivacy}
                    className={`p-2 rounded-xl transition-colors ${privacyMode
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                        }`}
                    title={privacyMode ? "Show numbers" : "Hide numbers"}
                >
                    {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                    title="Toggle Theme"
                >
                    {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>

            {showAddExpense && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setShowAddExpense(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            {t("common.close") || "Close"}
                        </button>
                        <div className="p-6">
                            <AddExpenseModal onClose={() => setShowAddExpense(false)} />
                        </div>
                    </div>
                </div>
            )}

            {showAddIncome && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setShowAddIncome(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            {t("common.close") || "Close"}
                        </button>
                        <div className="p-6">
                            <AddIncomeModal onClose={() => setShowAddIncome(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems: NavItem[] = [
        { href: "/", label: "Dashboard", icon: <Home size={18} /> },
        { href: "/transactions", label: "Transactions", icon: <List size={18} /> },
        { href: "/budget", label: "Budget", icon: <PieChart size={18} /> },
        { href: "/recurring", label: "Recurring", icon: <Repeat size={18} /> },
        { href: "/settings", label: "Settings", icon: <Settings size={18} /> },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <div className="flex min-h-screen bg-zinc-100 dark:bg-[#111111]">
            {/* Left Sidebar - Transparent, blends with global bg */}
            <aside className="sticky top-0 h-screen w-64 flex-shrink-0 flex flex-col bg-transparent">
                {/* Logo */}
                <div className="px-6 py-5">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tighter font-mono">
                        CIA
                    </h1>
                </div>

                {/* Navigation - High contrast active state */}
                <nav className="flex-1 px-3 py-2 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {session?.user?.email?.charAt(0).toUpperCase() || "U"}
                            </span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex-1">
                            {session?.user?.email || "User"}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area - Panel bg #171717 */}
            <main className="flex-1 px-6 py-6">
                <div className="min-h-[calc(100vh-3rem)] w-full bg-white dark:bg-[#171717] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    {children}
                </div>
            </main>
        </div>
    );
}
