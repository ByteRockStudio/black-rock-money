import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Delete in order to avoid foreign key constraints
        await prisma.recurringRule.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.account.deleteMany({});

        return NextResponse.json({ message: "All data (except users) has been deleted." });
    } catch (error) {
        console.error("RESET ERROR:", error);
        return NextResponse.json({ error: "Failed to reset database", details: String(error) }, { status: 500 });
    }
}
