import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    try {
        const { orderedIds } = await req.json();

        if (!Array.isArray(orderedIds)) {
            return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
        }

        // Update each account's orderIndex based on position in array
        const updatePromises = orderedIds.map((id: string, index: number) =>
            prisma.account.updateMany({
                where: {
                    id,
                    userId,
                },
                data: {
                    orderIndex: index,
                },
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering accounts:", error);
        return NextResponse.json({ error: "Failed to reorder accounts" }, { status: 500 });
    }
}
