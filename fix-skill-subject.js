// Check and update the Basic Addition skill's subject
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSkillSubject() {
  try {
    console.log('📝 Checking Basic Addition skill...');
    
    // Find MATH subject
    const mathSubject = await prisma.subject.findFirst({
      where: { code: 'MATH' },
    });
    
    if (!mathSubject) {
      console.log('❌ MATH subject not found! Creating it...');
      const newSubject = await prisma.subject.create({
        data: {
          code: 'MATH',
          name: 'Mathematics',
          nameFA: 'ریاضیات',
          order: 1,
        },
      });
      console.log(`✅ Created MATH subject: ${newSubject.id}`);
    }
    
    // Get the subject ID
    const subject = await prisma.subject.findFirst({
      where: { code: 'MATH' },
    });
    
    // Update the skill
    const skill = await prisma.skill.update({
      where: { id: 'skill-addition-basic' },
      data: {
        subjectId: subject.id,
      },
      include: { subject: true },
    });
    
    console.log('✅ Skill updated:');
    console.log(`   - Name: ${skill.name}`);
    console.log(`   - Code: ${skill.code}`);
    console.log(`   - Subject: ${skill.subject.name} (${skill.subject.code})`);
    console.log(`   - Grade Band: ${skill.gradeBandMin} to ${skill.gradeBandMax}`);
    console.log('\n💡 Now the skill is properly linked to MATH subject!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkillSubject();
