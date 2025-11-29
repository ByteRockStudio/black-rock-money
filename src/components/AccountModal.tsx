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
        currency: "UAH",
    });

    useEffect(() => {
        if (account) {
            setForm({
                name: account.name,
                type: account.type,
                startingBalance: String(account.startingBalance),
                currency: account.currency,
            });
        } else {
            setForm({
                name: "",
                type: "card",
                startingBalance: "",
                currency: "UAH",
            });
        }
    }, [account, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = account ? "PUT" : "POST";
        const body = account
            ? { id: account.id, name: form.name, type: form.type, currency: form.currency }
            : form;

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
            <div className="bg-card border text-card-foreground rounded-lg shadow-lg w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X size={20} />
                </button>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6">
                        {account ? t("settings.edit") : t("settings.add_account")}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t("settings.account_name")}</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="border-input focus:border-foreground rounded-md"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t("settings.type_card")}/{t("settings.type_cash")}</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                    required
                                >
                                    <option value="card">{t("settings.type_card")}</option>
                                    <option value="cash">{t("settings.type_cash")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t("add.currency")}</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                    required
                                >
                                    <option value="UAH">UAH</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        {!account && (
                            <div>
                                <label className="block text-sm font-medium mb-1">{t("settings.initial_balance")}</label>
                                <Input
                                    type="number"
                                    value={form.startingBalance}
                                    onChange={(e) => setForm({ ...form, startingBalance: e.target.value })}
                                    required
                                    className="border-input focus:border-foreground rounded-md"
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
