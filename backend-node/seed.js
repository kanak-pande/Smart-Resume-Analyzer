const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    let role = await prisma.role.findUnique({ where: { name: 'RECRUITER' } });
    if (!role) {
        role = await prisma.role.create({ data: { name: 'RECRUITER' } });
    }

    const rec = await prisma.user.create({ 
        data: { 
            email: 'recruiter@google.com', 
            passwordHash: 'hash', 
            roleId: role.id,
            recruiterProfile: { 
                create: { companyName: 'Google' } 
            } 
        },
        include: { recruiterProfile: true }
    });

    await prisma.job.create({ 
        data: { 
            recruiterId: rec.recruiterProfile.id, 
            title: 'Frontend Engineer', 
            company: 'Google', 
            description: 'We are looking for a strong frontend engineer to build interactive UI components using React, Node.js, and Tailwind CSS. You will collaborate with design and backend teams to deliver high-quality software.', 
            requiredSkills: JSON.stringify(['javascript', 'react', 'css', 'html', 'git']), 
            location: 'Remote', 
            employmentType: 'Full-time', 
            salary: '$120,000' 
        } 
    });

    await prisma.job.create({ 
        data: { 
            recruiterId: rec.recruiterProfile.id, 
            title: 'Data Scientist', 
            company: 'Google', 
            description: 'Join our AI team to build predictive models. Required: Python, SQL, Machine Learning, and NLP experience.', 
            requiredSkills: JSON.stringify(['python', 'sql', 'machine learning', 'nlp']), 
            location: 'Mountain View, CA', 
            employmentType: 'Full-time', 
            salary: '$150,000' 
        } 
    });
    console.log("Seeded successfully");
}

seed().catch(console.error).finally(()=>prisma.$disconnect());
