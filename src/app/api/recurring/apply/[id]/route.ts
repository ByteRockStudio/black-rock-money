import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    // Transaction logic
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Transaction
        const transaction = await tx.transaction.create({
            data: {
                accountId: recurringExpense.accountId,
                categoryId: recurringExpense.categoryId,
                amount: recurringExpense.amount,
                type: "expense",
                comment: `Recurring: ${recurringExpense.name}`,
                date: new Date(),
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

        // 3. Update RecurringExpense lastAppliedDate
        await tx.recurringExpense.update({
            where: { id: recurringExpense.id },
            data: {
                lastAppliedDate: new Date(),
            },
        });

        return transaction;
    });

    return NextResponse.json(result);
}
