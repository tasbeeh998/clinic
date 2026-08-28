const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await argon2.hash('Admin@12345');
    const user = await prisma.user.upsert({
        where: { email: 'admin@clinic.com' },
        update: {},
        create: {
            email: 'admin@clinic.com',
            passwordHash,
            name: 'Admin',
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin created:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
