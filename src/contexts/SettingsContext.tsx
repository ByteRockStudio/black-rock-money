"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ukr";
type Theme = "light" | "dark";

interface SettingsContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        "app.title": "Budget App",
        "nav.add": "Add Expense",
        "nav.view": "View Expenses",
        "nav.budget": "Budget",
        "nav.recurring": "Recurring",
        "nav.settings": "Settings",
        "nav.income": "Add Income",
        "header.balance": "Total Balance",
        "header.monthly": "Monthly Overview",
        "common.loading": "Loading...",
        "common.close": "Close",
        "common.cancel": "Cancel",
        "common.add": "Add",
        "common.delete": "Delete",
        "common.save": "Save",
        "common.system": "System",
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
        "app.title": "Бюджет",
        "nav.add": "Додати витрату",
        "nav.view": "Історія",
        "nav.budget": "Бюджет",
        "nav.recurring": "Регулярні",
        "nav.settings": "Налаштування",
        "nav.income": "Додати дохід",
        "header.balance": "Загальний баланс",
        "header.monthly": "Огляд за місяць",
        "common.loading": "Завантаження...",
        "common.close": "Закрити",
        "common.cancel": "Скасувати",
        "common.add": "Додати",
        "common.delete": "Видалити",
        "common.save": "Зберегти",
        "common.system": "Система",
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

    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language;
        const savedTheme = localStorage.getItem("theme") as Theme;

        if (savedLang) setLanguage(savedLang);
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
        }
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

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
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
