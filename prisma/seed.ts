import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.admin.create({
    data: {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@buck.com',
      password: adminPassword,
    },
  });
  console.log('✅ Created admin user');

  // Create creator users
  const creatorPassword = await hashPassword('creator123');
  const creator1 = await prisma.creator.create({
    data: {
      name: 'John Creator',
      username: 'johncreator',
      email: 'john@buck.com',
      password: creatorPassword,
      bio: 'I create amazing content for everyone!',
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      name: 'Jane Artist',
      username: 'janeartist',
      email: 'jane@buck.com',
      password: creatorPassword,
      bio: 'Digital artist and content creator.',
    },
  });
  console.log('✅ Created creator users');

  // Create member users
  const memberPassword = await hashPassword('member123');
  const member1 = await prisma.member.create({
    data: {
      name: 'Mike Member',
      username: 'mikemember',
      email: 'mike@buck.com',
      password: memberPassword,
    },
  });

  const member2 = await prisma.member.create({
    data: {
      name: 'Sarah Fan',
      username: 'sarahfan',
      email: 'sarah@buck.com',
      password: memberPassword,
    },
  });
  console.log('✅ Created member users');

  // Create sample content
  const content1 = await prisma.content.create({
    data: {
      title: 'My First Video',
      description: 'This is my first amazing video content!',
      type: 'video',
      url: 'https://example.com/video1.mp4',
      isPublished: true,
      creatorId: creator1.id,
    },
  });

  const content2 = await prisma.content.create({
    data: {
      title: 'Digital Art Tutorial',
      description: 'Learn how to create digital art step by step.',
      type: 'video',
      url: 'https://example.com/tutorial1.mp4',
      isPublished: true,
      creatorId: creator2.id,
    },
  });
  console.log('✅ Created sample content');

  // Create analytics data
  await prisma.analytics.create({
    data: {
      creatorId: creator1.id,
      views: 150,
      likes: 25,
      shares: 5,
    },
  });

  await prisma.analytics.create({
    data: {
      creatorId: creator2.id,
      views: 200,
      likes: 40,
      shares: 8,
    },
  });
  console.log('✅ Created analytics data');

  // Create subscriptions
  await prisma.subscription.create({
    data: {
      memberId: member1.id,
    },
  });

  await prisma.subscription.create({
    data: {
      memberId: member2.id,
    },
  });
  console.log('✅ Created subscriptions');

  console.log('🎉 Database seeding completed!');
  console.log('📝 Test credentials:');
  console.log('   Admin: admin@buck.com / admin123');
  console.log('   Creator: john@buck.com / creator123');
  console.log('   Member: mike@buck.com / member123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
