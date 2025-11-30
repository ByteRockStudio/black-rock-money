import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
    const { t } = useSettings();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                    <p className="text-zinc-400 mb-8">{message}</p>

                    <div className="flex gap-4 justify-center">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white min-w-[100px]"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white border-none min-w-[100px]"
                        >
                            {t("common.delete")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
