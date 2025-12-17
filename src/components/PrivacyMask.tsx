"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";
import { cn } from "@/lib/utils";

interface PrivacyMaskProps {
    children?: React.ReactNode;
    value?: string | number;
    className?: string;
    blurIntensity?: "sm" | "md" | "lg";
}

export function PrivacyMask({ children, value, className, blurIntensity = "sm" }: PrivacyMaskProps) {
    const { isPrivacyEnabled } = usePrivacy();

    const content = value !== undefined ? value : children;

    if (isPrivacyEnabled) {
        // We use a fixed width container-like behavior or just blur the text itself
        // Select-none prevents copying the hidden value
        return (
            <span className={cn("filter blur-md select-none transition-all duration-300", className)}>
                {content}
            </span>
        );
    }

    return <span className={cn("transition-all duration-300", className)}>{content}</span>;
}
