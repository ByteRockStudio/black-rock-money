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

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            exchangeRate: true,
        },
    });

    return NextResponse.json({ exchangeRate: user?.exchangeRate || 42 });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { exchangeRate } = body;

    const user = await prisma.user.update({
        where: { id: userId },
        data: { exchangeRate: parseFloat(exchangeRate) },
    });

    return NextResponse.json({ exchangeRate: user.exchangeRate });
}
