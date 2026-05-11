const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database for skills...\n');

  const skills = await prisma.skill.findMany({
    include: {
      subject: true,
    },
  });

  if (skills.length === 0) {
    console.log('❌ No skills found in database!');
    console.log('\n💡 Creating a sample skill for testing...\n');

    // Ensure Math subject exists
    const mathSubject = await prisma.subject.upsert({
      where: { code: 'MATH' },
      update: {},
      create: {
        code: 'MATH',
        name: 'Mathematics',
        nameFA: 'ریاضیات',
        icon: '🔢',
        color: '#3B82F6',
        description: 'Mathematics K-12',
      },
    });

    // Create a skill
    const skill = await prisma.skill.create({
      data: {
        id: 'skill-addition-basic',
        subjectId: mathSubject.id,
        code: 'ADD_BASIC',
        name: 'Basic Addition',
        nameFA: 'جمع پایه',
        description: 'Adding single and double digit numbers',
        gradeBandMin: 'EARLY_YEARS',
        gradeBandMax: 'PRIMARY',
        order: 1,
        isActive: true,
      },
    });

    console.log('✅ Created skill:', skill.name);
    console.log('   ID:', skill.id);
    console.log('   Code:', skill.code);
    console.log('\n📋 Use this skillId when approving questions: skill-addition-basic\n');
  } else {
    console.log(`✅ Found ${skills.length} skills:\n`);
    skills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name} (${skill.subject.name})`);
      console.log(`   ID: ${skill.id}`);
      console.log(`   Code: ${skill.code}`);
      console.log('');
    });
    console.log(`📋 Use any of these skill IDs when approving scraped content.\n`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
