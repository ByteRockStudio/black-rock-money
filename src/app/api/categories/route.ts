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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    // Build where clause with optional type filtering
    const whereClause: any = {
        OR: [
            { userId: null }, // System categories
            { userId: userId }, // User categories
        ],
    };

    // Add type filter if specified (INCOME or EXPENSE)
    if (type === "INCOME" || type === "EXPENSE") {
        whereClause.type = type.toLowerCase();
    }

    const categories = await prisma.category.findMany({
        where: whereClause,
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
    console.log("API: DELETE /api/categories - Start");

    const session = await getServerSession(authOptions);
    console.log("API: Session object:", JSON.stringify(session, null, 2));

    // Fix: Check for session.user instead of session.user.email
    // The logs show that the session has an ID but no email, which is valid for this app's auth strategy.
    if (!session || !session.user) {
        console.log("API: Unauthorized - No session or user");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Strict check: Find category that matches BOTH id AND userId
    const category = await prisma.category.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!category) {
        // If not found, it either doesn't exist or belongs to another user
        return NextResponse.json({ error: "Category not found or access denied" }, { status: 404 });
    }

    // Check for existing transactions
    const transactionCount = await prisma.transaction.count({
        where: { categoryId: id },
    });

    if (transactionCount > 0) {
        return NextResponse.json(
            { error: "Cannot delete category with existing transactions. Please delete or reassign them first." },
            { status: 409 }
        );
    }

    try {
        await prisma.category.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Category deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
