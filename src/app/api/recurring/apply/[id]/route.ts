import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

/**
 * Calculate the next due date based on the CURRENT schedule, not today's date.
 * This ensures the recurring expense stays anchored to its original schedule.
 * 
 * Example: Due Jan 5 → User clicks "Apply" on Jan 7 → Next due is Feb 5 (not Feb 7)
 */
function calculateNextDueDate(recurringExpense: {
    startDate: Date;
    lastAppliedDate: Date | null;
    recurrenceType: string;
    recurrenceInterval: number;
}): Date {
    // Determine the base date: use lastAppliedDate if exists, otherwise startDate
    const baseDate = recurringExpense.lastAppliedDate
        ? new Date(recurringExpense.lastAppliedDate)
        : new Date(recurringExpense.startDate);

    const interval = recurringExpense.recurrenceInterval || 1;

    switch (recurringExpense.recurrenceType) {
        case "DAILY":
            return addDays(baseDate, interval);
        case "WEEKLY":
            return addWeeks(baseDate, interval);
        case "MONTHLY":
            return addMonths(baseDate, interval);
        case "YEARLY":
            return addYears(baseDate, interval);
        default:
            return addMonths(baseDate, interval);
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { id } = params;

    // Fetch recurring expense
    const recurringExpense = await prisma.recurringExpense.findUnique({
        where: { id },
        include: { account: true },
    });

    if (!recurringExpense || recurringExpense.userId !== userId) {
        return new NextResponse("Recurring expense not found", { status: 404 });
    }

    // Skip if paused
    if (recurringExpense.isPaused) {
        return new NextResponse("Expense is paused", { status: 400 });
    }

    // Calculate the next due date BEFORE applying (anchored to schedule)
    const nextDueDate = calculateNextDueDate(recurringExpense);

    // Transaction logic
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Transaction (use actual date for the transaction record)
        const transaction = await tx.transaction.create({
            data: {
                accountId: recurringExpense.accountId,
                categoryId: recurringExpense.categoryId,
                amount: recurringExpense.amount,
                type: "expense",
                comment: `Recurring: ${recurringExpense.name}`,
                date: new Date(), // Transaction date is today
                isRecurring: true,
                recurringExpenseId: recurringExpense.id,
            },
        });

        // 2. Update Account Balance
        await tx.account.update({
            where: { id: recurringExpense.accountId },
            data: {
                balance: {
                    decrement: recurringExpense.amount,
                },
            },
        });

        // 3. Update RecurringExpense with the ANCHORED next due date
        // This preserves the original schedule (e.g., always on the 5th)
        await tx.recurringExpense.update({
            where: { id: recurringExpense.id },
            data: {
                lastAppliedDate: nextDueDate,
            },
        });

        return transaction;
    });

    return NextResponse.json(result);
}
