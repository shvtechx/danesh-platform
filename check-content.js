const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const content = await prisma.scrapedContent.findMany();
  console.log('Total scraped content:', content.length);
  if (content.length > 0) {
    console.log('\nSample:');
    console.log('- Question:', content[0].questionText);
    console.log('- Status:', content[0].reviewStatus);
    console.log('- Source ID:', content[0].sourceId);
  }
  await prisma.$disconnect();
}

check();
