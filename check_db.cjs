const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const table = process.argv[2] || 'user';
    try {
        const data = await prisma[table].findMany();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
