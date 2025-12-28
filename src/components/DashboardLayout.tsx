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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, setTheme, language, setLanguage, privacyMode, togglePrivacy, t } = useSettings();

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddIncome, setShowAddIncome] = useState(false);

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

    const getPageTitle = () => {
        const segment = pathname.split("/").filter(Boolean)[0];
        if (!segment) return "Dashboard";
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
    const toggleLanguage = () => setLanguage(language === "en" ? "ukr" : "en");

    return (
        <div className="flex h-screen w-full overflow-hidden bg-zinc-100 dark:bg-[#09090b]">
            {/* Left Sidebar */}
            <aside className="w-64 flex-shrink-0 h-full flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                {/* Logo */}
                <div className="px-6 py-5">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tighter font-mono">
                        CIA
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
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

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
                    {/* Page Title */}
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {getPageTitle()}
                    </h2>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Add Transaction Button */}
                        <button
                            onClick={() => setShowAddExpense(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                        >
                            <Plus size={16} />
                            Add Transaction
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />

                        {/* Privacy Toggle */}
                        <button
                            onClick={togglePrivacy}
                            className={`p-2 rounded-xl transition-colors ${privacyMode
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                }`}
                            title={privacyMode ? "Show numbers" : "Hide numbers"}
                        >
                            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* Logout */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-black">
                    {children}
                </main>
            </div>

            {/* Modals */}
            {showAddExpense && (
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-xl w-full max-w-md relative">
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-xl w-full max-w-md relative">
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
        </div>
    );
}
