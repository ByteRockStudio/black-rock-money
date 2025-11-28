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

    const categories = await prisma.category.findMany({
        where: {
            OR: [
                { userId: null }, // System categories
                { userId: userId }, // User categories
            ],
        },
    });
    return NextResponse.json(categories);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { name, type, budgetLimit } = body;

    const category = await prisma.category.create({
        data: {
            name,
            type: type || "expense",
            budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null,
            userId,
        },
    });

    return NextResponse.json(category);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await req.json();
    const { id, name, budgetLimit } = body;

    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category || category.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await prisma.category.update({
        where: { id },
        data: {
            name,
            budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null
        },
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

    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        return new NextResponse("Category not found", { status: 404 });
    }

    if (category.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.category.delete({
        where: { id },
    });

    return new NextResponse("Deleted", { status: 200 });
}
