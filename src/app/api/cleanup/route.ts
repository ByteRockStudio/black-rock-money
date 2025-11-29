import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
    try {
        await prisma.category.deleteMany({});
        return NextResponse.json({ message: "All categories deleted" });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: "Failed to delete categories" }, { status: 500 });
    }
}
