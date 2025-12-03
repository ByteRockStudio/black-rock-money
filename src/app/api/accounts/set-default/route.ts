import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
        return new NextResponse("Missing accountId", { status: 400 });
    }

    // Verify the account belongs to the user
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Transactional update: Reset all accounts, then set selected as default
    await prisma.$transaction([
        prisma.account.updateMany({
            where: { userId },
            data: { isDefault: false },
        }),
        prisma.account.update({
            where: { id: accountId },
            data: { isDefault: true },
        }),
    ]);

    const updatedAccount = await prisma.account.findUnique({
        where: { id: accountId },
    });

    return NextResponse.json(updatedAccount);
}
