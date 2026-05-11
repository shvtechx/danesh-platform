// Update the Basic Addition skill to include subject code for better matching
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSkill() {
  try {
    console.log('📝 Updating Basic Addition skill...');
    
    const skill = await prisma.skill.update({
      where: { id: 'skill-addition-basic' },
      data: {
        subjectCode: 'MATH',
        gradeBandMin: 'EARLY_YEARS',
        gradeBandMax: 'PRIMARY',
      },
    });
    
    console.log('✅ Skill updated:');
    console.log(`   - Name: ${skill.name}`);
    console.log(`   - Code: ${skill.code}`);
    console.log(`   - Subject: ${skill.subjectCode}`);
    console.log(`   - Grade Band: ${skill.gradeBandMin} to ${skill.gradeBandMax}`);
    console.log('\n💡 Now the skill will auto-match with MATH grade 1 questions!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSkill();
