import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { id } = params;
    const body = await req.json();
    const {
        name,
        amount,
        accountId,
        categoryId,
        recurrenceType,
        recurrenceInterval,
        startDate,
        isActive,
    } = body;

    // Verify existence and ownership
    const existingExpense = await prisma.recurringExpense.findUnique({
        where: { id },
    });

    if (!existingExpense || existingExpense.userId !== userId) {
        return new NextResponse("Recurring expense not found", { status: 404 });
    }

    const updatedExpense = await prisma.recurringExpense.update({
        where: { id },
        data: {
            name,
            amount: parseFloat(amount),
            accountId,
            categoryId,
            recurrenceType,
            recurrenceInterval: parseInt(recurrenceInterval),
            startDate: startDate ? new Date(startDate) : undefined,
            isActive,
        },
    });

    return NextResponse.json(updatedExpense);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { id } = params;

    const existingExpense = await prisma.recurringExpense.findUnique({
        where: { id },
    });

    if (!existingExpense || existingExpense.userId !== userId) {
        return new NextResponse("Recurring expense not found", { status: 404 });
    }

    await prisma.recurringExpense.delete({
        where: { id },
    });

    return new NextResponse("Deleted", { status: 200 });
}
