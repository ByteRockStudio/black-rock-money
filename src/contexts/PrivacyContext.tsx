"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextType {
    isPrivacyEnabled: boolean;
    togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("privacy-mode");
        if (saved !== null) {
            setIsPrivacyEnabled(saved === "true");
        }
    }, []);

    const togglePrivacy = () => {
        setIsPrivacyEnabled((prev) => {
            const newValue = !prev;
            localStorage.setItem("privacy-mode", String(newValue));
            return newValue;
        });
    };

    return (
        <PrivacyContext.Provider value={{ isPrivacyEnabled, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error("usePrivacy must be used within a PrivacyProvider");
    }
    return context;
}
