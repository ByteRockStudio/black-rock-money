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

    try {
        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Calculate days left in month
        const lastDayOfMonth = endOfMonth.getDate();
        const daysLeftInMonth = lastDayOfMonth - now.getDate() + 1;

        // Fetch all EXPENSE categories with budget limits
        const categories = await prisma.category.findMany({
            where: {
                OR: [
                    { userId: null }, // System categories
                    { userId: userId }, // User categories
                ],
                type: "expense",
                budgetLimit: { not: null }, // Only categories with budget limits
            },
            include: {
                transactions: {
                    where: {
                        type: "expense",
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    },
                },
            },
        });

        // Calculate spent amount and percentage for each category
        const budgetData = categories.map((category) => {
            const spent = category.transactions.reduce((sum, t) => sum + t.amount, 0);
            const budgetLimit = category.budgetLimit || 0;
            const percentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
            const isOverBudget = spent > budgetLimit;

            return {
                id: category.id,
                name: category.name,
                budgetLimit,
                spent,
                percentage,
                isOverBudget,
            };
        });

        // Sort by percentage (descending) - overbudget items first
        budgetData.sort((a, b) => b.percentage - a.percentage);

        // Calculate totals
        const totalBudget = budgetData.reduce((sum, cat) => sum + cat.budgetLimit, 0);
        const totalSpent = budgetData.reduce((sum, cat) => sum + cat.spent, 0);

        return NextResponse.json({
            categories: budgetData,
            totalBudget,
            totalSpent,
            daysLeftInMonth,
        });
    } catch (error) {
        console.error("Budget API error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
