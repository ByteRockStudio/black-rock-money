import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        return new NextResponse("User already exists", { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            passwordHash,
        },
    });

    return NextResponse.json({ id: user.id, username: user.username });
}
