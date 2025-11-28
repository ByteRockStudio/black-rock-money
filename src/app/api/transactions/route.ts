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

    const whereClause: any = {
        account: {
            userId,
        },
    };

    if (accountId) {
        whereClause.accountId = accountId;
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
