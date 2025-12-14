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

    // Verify existence and ownership
    const existingExpense = await prisma.recurringExpense.findUnique({
        where: { id },
    });

    if (!existingExpense || existingExpense.userId !== userId) {
        return new NextResponse("Recurring expense not found", { status: 404 });
    }

    // Toggle isPaused
    const updatedExpense = await prisma.recurringExpense.update({
        where: { id },
        data: {
            isPaused: !existingExpense.isPaused,
        },
        include: {
            category: true,
            account: true,
        },
    });

    return NextResponse.json(updatedExpense);
}
