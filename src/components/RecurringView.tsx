"use client";

interface RecurringViewProps {
    onClose: () => void;
}

export function RecurringView({ onClose }: RecurringViewProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Recurring Expenses</h2>
            <p className="text-muted-foreground">Manage your automatic payments here.</p>

            <div className="border rounded-lg p-8 text-center text-muted-foreground">
                No recurring expenses set up yet.
            </div>
        </div>
    );
}
