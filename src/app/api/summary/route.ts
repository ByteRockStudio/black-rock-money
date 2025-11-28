import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    // 1. Calculate Total Balance per Currency
    const accounts = await prisma.account.findMany({
        where: { userId },
    });

    const balanceByCurrency: Record<string, number> = {};
    accounts.forEach((acc) => {
        if (!balanceByCurrency[acc.currency]) {
            balanceByCurrency[acc.currency] = 0;
        }
        balanceByCurrency[acc.currency] += acc.balance;
    });

    // 2. Calculate Monthly Income and Expenses
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const transactions = await prisma.transaction.findMany({
        where: {
            account: { userId },
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // Note: This simple calculation assumes all transactions are in the same currency or doesn't handle currency conversion.
    // For MVP, we'll just sum up raw numbers or ideally we should group by currency too.
    // Given the requirement "Total: ₴150,000 | $2,500", let's group monthly stats by currency as well, 
    // OR just assume a primary currency for the monthly overview if not specified. 
    // The prompt says "November: +₴37,000 | -₴13,242", implying currency symbols.
    // Let's return monthly stats grouped by currency.

    const monthlyStatsByCurrency: Record<string, { income: number; expense: number }> = {};

    // We need to fetch account currency for each transaction. 
    // We already fetched accounts, so we can map accountId to currency.
    const accountCurrencyMap = new Map(accounts.map(a => [a.id, a.currency]));

    transactions.forEach((t) => {
        const currency = accountCurrencyMap.get(t.accountId) || "UAH";
        if (!monthlyStatsByCurrency[currency]) {
            monthlyStatsByCurrency[currency] = { income: 0, expense: 0 };
        }

        if (t.type === "income") {
            monthlyStatsByCurrency[currency].income += t.amount;
        } else if (t.type === "expense") {
            monthlyStatsByCurrency[currency].expense += t.amount;
        }
    });

    return NextResponse.json({
        totalBalance: balanceByCurrency,
        monthlyStats: monthlyStatsByCurrency,
    });
}
