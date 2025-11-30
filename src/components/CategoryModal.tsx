import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";
import { X } from "lucide-react";

interface Category {
    id: string;
    name: string;
    type: string;
    budgetLimit: number | null;
    userId: string | null;
}

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
    type: "income" | "expense";
    onSave: () => void;
}

export function CategoryModal({ isOpen, onClose, category, type, onSave }: CategoryModalProps) {
    const { t } = useSettings();
    const [form, setForm] = useState({
        name: "",
        budgetLimit: "",
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }

        if (category) {
            setForm({
                name: category.name,
                budgetLimit: category.budgetLimit ? String(category.budgetLimit) : "",
            });
        } else {
            setForm({
                name: "",
                budgetLimit: "",
            });
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [category, isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = category ? "PUT" : "POST";
        const body = category
            ? { id: category.id, name: form.name, budgetLimit: form.budgetLimit || null }
            : { name: form.name, type, budgetLimit: form.budgetLimit || null };

        const res = await fetch("/api/categories", {
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
                        {category ? t("settings.edit") : t("settings.add_category")}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t("settings.category_name")}</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="border-input focus:border-foreground rounded-md"
                            />
                        </div>
                        {type === "expense" && (
                            <div>
                                <label className="block text-sm font-medium mb-1">{t("settings.budget_limit")}</label>
                                <Input
                                    type="number"
                                    value={form.budgetLimit}
                                    onChange={(e) => setForm({ ...form, budgetLimit: e.target.value })}
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
