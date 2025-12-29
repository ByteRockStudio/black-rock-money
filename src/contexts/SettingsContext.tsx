"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ukr";
type Theme = "light" | "dark";

interface SettingsContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    exchangeRate: number;
    setExchangeRate: (rate: number) => void;
    privacyMode: boolean;
    togglePrivacy: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        "app.title": "Hard Rock Money",
        "nav.add": "Add Expense",
        "nav.view": "View Expenses",
        "nav.budget": "Budget",
        "nav.recurring": "Recurring",
        "nav.settings": "Settings",
        "nav.income": "Add Income",
        "header.balance": "Total Balance",
        "header.monthly": "Monthly Overview",
        "common.loading": "Loading...",
        "common.back": "Back",
        "common.close": "Close",
        "common.cancel": "Cancel",
        "common.add": "Add",
        "common.delete": "Delete",
        "common.save": "Save",
        "common.system": "System",
        "common.balance_wrapper": "({balance})",
        "add.title": "Add Expense",
        "add.income_title": "Add Income",
        "add.amount": "Amount",
        "add.currency": "Currency",
        "add.source": "Source Account",
        "add.destination": "Destination Account",
        "add.category": "Category",
        "add.source_category": "Source Category",
        "add.comment": "Comment",
        "add.submit": "Add Expense",
        "add.submit_income": "Add Income",
        "view.title": "Expenses",
        "view.total": "Total",
        "view.filter.month": "Month",
        "view.filter.week": "Week",
        "view.filter.day": "Day",
        "budget.title": "Budget",
        "budget.limit": "Limit",
        "budget.spent": "Spent",
        "budget.remaining": "Remaining",
        "recurring.title": "Recurring Expenses",
        "recurring.empty": "No recurring expenses set up yet.",
        "settings.title": "Settings",
        "settings.accounts": "Accounts",
        "settings.categories": "Manage Categories",
        "settings.add_account": "Add New Account",
        "settings.add_category": "Add New Category",
        "settings.account_name": "Account Name",
        "settings.initial_balance": "Initial Balance",
        "settings.category_name": "Category Name",
        "settings.budget_limit": "Budget Limit (Optional)",
        "settings.global_settings": "Global Settings",
        "settings.exchange_rate": "USD Exchange Rate",
        "settings.type_card": "Card",
        "settings.type_cash": "Cash",
        "settings.income_categories": "Income Sources",
        "settings.expense_categories": "Expense Categories",
        "settings.edit": "Edit",
        "settings.delete_account_title": "Delete Account",
        "settings.confirm_delete_account": "Are you sure you want to delete this account?",
        "settings.delete_account_failed": "Failed to delete account",
        "settings.delete_category_title": "Delete Category",
        "settings.confirm_delete_category": "Are you sure you want to delete this category?",
        "settings.delete_category_failed": "Failed to delete category",
        "login.title": "Login",
        "login.username": "Username",
        "login.password": "Password",
        "login.submit": "Sign In",
        "login.register_link": "Don't have an account? Register",
        "register.title": "Register",
        "register.submit": "Sign Up",
        "register.login_link": "Already have an account? Login",
    },
    ukr: {
        "app.title": "Hard Rock Money",
        "nav.add": "Додати витрату",
        "nav.view": "Історія",
        "nav.budget": "Бюджет",
        "nav.recurring": "Регулярні",
        "nav.settings": "Налаштування",
        "nav.income": "Додати дохід",
        "header.balance": "Загальний баланс",
        "header.monthly": "Огляд за місяць",
        "common.loading": "Завантаження...",
        "common.back": "Назад",
        "common.close": "Закрити",
        "common.cancel": "Скасувати",
        "common.add": "Додати",
        "common.delete": "Видалити",
        "common.save": "Зберегти",
        "common.system": "Система",
        "common.balance_wrapper": "({balance})",
        "add.title": "Додати витрату",
        "add.income_title": "Додати дохід",
        "add.amount": "Сума",
        "add.currency": "Валюта",
        "add.source": "Рахунок",
        "add.destination": "Рахунок зарахування",
        "add.category": "Категорія",
        "add.source_category": "Джерело доходу",
        "add.comment": "Коментар",
        "add.submit": "Додати",
        "add.submit_income": "Додати дохід",
        "view.title": "Історія витрат",
        "view.total": "Всього",
        "view.filter.month": "Місяць",
        "view.filter.week": "Тиждень",
        "view.filter.day": "День",
        "budget.title": "Бюджет",
        "budget.limit": "Ліміт",
        "budget.spent": "Витрачено",
        "budget.remaining": "Залишок",
        "recurring.title": "Регулярні платежі",
        "recurring.empty": "Регулярні платежі ще не налаштовані.",
        "settings.title": "Налаштування",
        "settings.accounts": "Рахунки",
        "settings.categories": "Категорії",
        "settings.add_account": "Додати рахунок",
        "settings.add_category": "Додати категорію",
        "settings.account_name": "Назва рахунку",
        "settings.initial_balance": "Початковий баланс",
        "settings.category_name": "Назва категорії",
        "settings.budget_limit": "Ліміт бюджету (опціонально)",
        "settings.global_settings": "Загальні налаштування",
        "settings.exchange_rate": "Курс долара (USD)",
        "settings.type_card": "Картка",
        "settings.type_cash": "Готівка",
        "settings.income_categories": "Джерела доходу",
        "settings.expense_categories": "Категорії витрат",
        "settings.edit": "Редагувати",
        "settings.delete_account_title": "Видалити рахунок",
        "settings.confirm_delete_account": "Ви впевнені, що хочете видалити цей рахунок?",
        "settings.delete_account_failed": "Не вдалося видалити рахунок",
        "settings.delete_category_title": "Видалити категорію",
        "settings.confirm_delete_category": "Ви впевнені, що хочете видалити цю категорію?",
        "settings.delete_category_failed": "Не вдалося видалити категорію",
        "login.title": "Вхід",
        "login.username": "Ім'я користувача",
        "login.password": "Пароль",
        "login.submit": "Увійти",
        "login.register_link": "Немає акаунту? Зареєструватися",
        "register.title": "Реєстрація",
        "register.submit": "Зареєструватися",
        "register.login_link": "Вже є акаунт? Увійти",
    },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");
    const [exchangeRate, setExchangeRateState] = useState<number>(42);
    const [privacyMode, setPrivacyMode] = useState<boolean>(false);

    const togglePrivacy = () => {
        setPrivacyMode(prev => {
            const newValue = !prev;
            localStorage.setItem("privacyMode", JSON.stringify(newValue));
            return newValue;
        });
    };

    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language;
        const savedTheme = localStorage.getItem("theme") as Theme;
        const savedPrivacy = localStorage.getItem("privacyMode");

        if (savedLang) setLanguage(savedLang);
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
        }
        if (savedPrivacy) setPrivacyMode(JSON.parse(savedPrivacy));

        // Fetch exchange rate from API
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => setExchangeRateState(data.exchangeRate))
            .catch(() => setExchangeRateState(42));
    }, []);

    useEffect(() => {
        localStorage.setItem("language", language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem("theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const t = (key: string, params?: Record<string, string | number>) => {
        let text = translations[language][key] || key;
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                text = text.replace(`{${param}}`, String(value));
            });
        }
        return text;
    };

    const setExchangeRate = async (rate: number) => {
        setExchangeRateState(rate);
        try {
            await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exchangeRate: rate }),
            });
        } catch (error) {
            console.error("Failed to update exchange rate", error);
        }
    };

    return (
        <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, exchangeRate, setExchangeRate, privacyMode, togglePrivacy, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
