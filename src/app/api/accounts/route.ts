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
        orderBy: { name: 'asc' },
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
    const { name, type, startingBalance, currency } = body;

    const account = await prisma.account.create({
        data: {
            userId,
            name,
            type,
            balance: parseFloat(startingBalance),
            startingBalance: parseFloat(startingBalance),
            currency,
        },
    });

    return NextResponse.json(account);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { id, name, type, currency, balance } = body;

    const account = await prisma.account.findUnique({
        where: { id },
    });

    if (!account || account.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = { name, type, currency };

    if (balance !== undefined && balance !== "") {
        const newBalance = parseFloat(balance);
        const difference = newBalance - account.balance;
        data.balance = newBalance;
        data.startingBalance = account.startingBalance + difference;
    }

    const updated = await prisma.account.update({
        where: { id },
        data,
    });

    return NextResponse.json(updated);
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

    const account = await prisma.account.findUnique({
        where: { id },
    });

    if (!account || account.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.account.delete({
        where: { id },
    });

    return new NextResponse("Deleted", { status: 200 });
}
