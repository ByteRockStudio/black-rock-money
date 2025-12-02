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

    const recurringExpenses = await prisma.recurringExpense.findMany({
        where: {
            userId,
        },
        include: {
            category: true,
            account: true,
        },
        orderBy: {
            startDate: "asc",
        },
    });

    return NextResponse.json(recurringExpenses);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const {
        name,
        amount,
        accountId,
        categoryId,
        recurrenceType,
        recurrenceInterval,
        startDate,
    } = body;

    // Validation
    if (!name || !amount || !accountId || !categoryId || !recurrenceType || !startDate) {
        return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
        return new NextResponse("Invalid account", { status: 400 });
    }

    const expenseAmount = parseFloat(amount);

    const recurringExpense = await prisma.recurringExpense.create({
        data: {
            userId,
            name,
            amount: expenseAmount,
            accountId,
            categoryId,
            recurrenceType,
            recurrenceInterval: parseInt(recurrenceInterval) || 1,
            startDate: new Date(startDate),
            isActive: true,
        },
    });

    return NextResponse.json(recurringExpense);
}
