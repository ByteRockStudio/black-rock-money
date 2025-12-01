import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const type = searchParams.get("type");

    const whereClause: any = {
        account: {
            userId,
        },
    };

    if (accountId) {
        whereClause.accountId = accountId;
    }

    if (start && end) {
        whereClause.date = {
            gte: new Date(start),
            lte: new Date(end),
        };
    }

    if (type && type !== "all") {
        whereClause.type = type;
    }

    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
            category: true,
            account: true,
        },
        orderBy: {
            date: "desc",
        },
    });

    return NextResponse.json(transactions);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { accountId, categoryId, amount, type, comment, date } = body;

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
        return new NextResponse("Invalid account", { status: 400 });
    }

    const transactionAmount = parseFloat(amount);

    // Transaction logic
    const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                accountId,
                categoryId,
                amount: transactionAmount,
                type,
                comment,
                date: date ? new Date(date) : new Date(),
            },
        });

        // Update account balance
        let balanceChange = 0;
        if (type === "expense") {
            balanceChange = -transactionAmount;
        } else if (type === "income") {
            balanceChange = transactionAmount;
        }

        await tx.account.update({
            where: { id: accountId },
            data: {
                balance: {
                    increment: balanceChange,
                },
            },
        });

        return transaction;
    });

    return NextResponse.json(result);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { id, accountId, categoryId, amount, type, comment, date } = body;

    // Verify transaction exists and belongs to user (via account)
    const existingTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true },
    });

    if (!existingTransaction || existingTransaction.account.userId !== userId) {
        return new NextResponse("Transaction not found or access denied", { status: 404 });
    }

    const newAmount = parseFloat(amount);
    const oldAmount = existingTransaction.amount;
    const oldType = existingTransaction.type;

    // Transaction logic
    const result = await prisma.$transaction(async (tx) => {
        // 1. Revert old balance effect
        let revertChange = 0;
        if (oldType === "expense") {
            revertChange = oldAmount; // Add back expense
        } else if (oldType === "income") {
            revertChange = -oldAmount; // Remove income
        }

        await tx.account.update({
            where: { id: existingTransaction.accountId },
            data: { balance: { increment: revertChange } },
        });

        // 2. Update transaction
        const updatedTransaction = await tx.transaction.update({
            where: { id },
            data: {
                accountId,
                categoryId,
                amount: newAmount,
                type,
                comment,
                date: date ? new Date(date) : new Date(),
            },
        });

        // 3. Apply new balance effect
        let newChange = 0;
        if (type === "expense") {
            newChange = -newAmount;
        } else if (type === "income") {
            newChange = newAmount;
        }

        // Note: If accountId changed, we need to handle that too, but for simplicity assuming same account for now
        // or we would need to update two different accounts. 
        // For MVP, let's assume account update is on the same account or handle simple switch.
        // Actually, if accountId changes, we need to update the NEW account.

        await tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: newChange } },
        });

        return updatedTransaction;
    });

    return NextResponse.json(result);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing id", { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true },
    });

    if (!transaction || transaction.account.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
        // Revert balance
        let revertChange = 0;
        if (transaction.type === "expense") {
            revertChange = transaction.amount;
        } else if (transaction.type === "income") {
            revertChange = -transaction.amount;
        }

        await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: revertChange } },
        });

        await tx.transaction.delete({
            where: { id },
        });
    });

    return new NextResponse("Deleted", { status: 200 });
}
