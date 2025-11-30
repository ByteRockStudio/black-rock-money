import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";
import { X } from "lucide-react";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    startingBalance: number;
    currency: string;
}

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    account?: Account | null;
    onSave: () => void;
}

export function AccountModal({ isOpen, onClose, account, onSave }: AccountModalProps) {
    const { t } = useSettings();
    const [form, setForm] = useState({
        name: "",
        type: "card",
        startingBalance: "",
        balance: "", // For manual editing
        currency: "UAH",
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }

        if (account) {
            setForm({
                name: account.name,
                type: account.type,
                startingBalance: String(account.startingBalance),
                balance: String(account.balance),
                currency: account.currency,
            });
        } else {
            setForm({
                name: "",
                type: "card",
                startingBalance: "",
                balance: "",
                currency: "UAH",
            });
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [account, isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = account ? "PUT" : "POST";
        const body = account
            ? {
                id: account.id,
                name: form.name,
                type: form.type,
                currency: form.currency,
                balance: form.balance // Send balance for manual update
            }
            : {
                name: form.name,
                type: form.type,
                startingBalance: form.startingBalance,
                currency: form.currency
            };

        const res = await fetch("/api/accounts", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            onSave();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border text-card-foreground rounded-lg shadow-lg w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>

                <div className="p-6 pt-8">
                    <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">
                        {account ? t("settings.edit") : t("settings.add_account")}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t("settings.account_name")}
                            </label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    {t("settings.type_card")}/{t("settings.type_cash")}
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="card">{t("settings.type_card")}</option>
                                    <option value="cash">{t("settings.type_cash")}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    {t("add.currency")}
                                </label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="UAH">UAH</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        {account ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Current Balance (Manual Adjustment)
                                </label>
                                <Input
                                    type="number"
                                    value={form.balance}
                                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                                    required
                                    className="h-10"
                                    step="0.01"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Updating this will adjust the starting balance to match.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    {t("settings.initial_balance")}
                                </label>
                                <Input
                                    type="number"
                                    value={form.startingBalance}
                                    onChange={(e) => setForm({ ...form, startingBalance: e.target.value })}
                                    required
                                    className="h-10"
                                    step="0.01"
                                />
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <Button type="submit" className="flex-1 bg-foreground text-background hover:bg-foreground/90">
                                {t("common.save")}
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                {t("common.cancel")}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
