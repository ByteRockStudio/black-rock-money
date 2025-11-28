import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    const accounts = await prisma.account.findMany({
        where: { userId },
    });

    return NextResponse.json(accounts);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { name, type, balance, currency } = body;

    const account = await prisma.account.create({
        data: {
            userId,
            name,
            type,
            balance: parseFloat(balance),
            currency,
        },
    });

    return NextResponse.json(account);
}
