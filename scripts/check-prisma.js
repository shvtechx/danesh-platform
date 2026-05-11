const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const [users, subjects, scraped] = await Promise.all([
      prisma.user.count(),
      prisma.subject.count(),
      prisma.scrapedContent.count(),
    ]);

    console.log(JSON.stringify({ users, subjects, scraped }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
