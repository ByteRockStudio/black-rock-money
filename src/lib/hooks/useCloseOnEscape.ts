"use client";

import { useEffect, useCallback } from "react";

/**
 * Custom hook to execute a callback when the Escape key is pressed.
 * @param callback - Function to execute on ESC key press
 */
export function useCloseOnEscape(callback: () => void) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                callback();
            }
        },
        [callback]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);
}
