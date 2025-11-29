import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.category.deleteMany({});
        console.log("All categories deleted successfully.");
    } catch (error) {
        console.error("Error deleting categories:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
