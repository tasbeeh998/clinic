const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const expectedHost = 'postgres';
const developmentDatabase = 'clinic_db';

function assertSafeDevelopmentEnvironment() {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Development admin seeding is disabled outside NODE_ENV=development.');
    }
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required. Run this command inside the development API container.');
    }

    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname !== expectedHost || url.pathname.replace(/^\//, '') !== developmentDatabase) {
        throw new Error('Refusing to seed a non-development database. Run this command inside the development API container.');
    }
}

async function main() {
    assertSafeDevelopmentEnvironment();
    const passwordHash = await argon2.hash('Admin@12345');
    const user = await prisma.user.upsert({
        where: { email: 'admin@clinic.com' },
        update: { passwordHash, name: 'Admin', role: 'ADMIN', isActive: true },
        create: {
            email: 'admin@clinic.com',
            passwordHash,
            name: 'Admin',
            role: 'ADMIN',
        },
    });
    console.log(`Development admin is ready: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
