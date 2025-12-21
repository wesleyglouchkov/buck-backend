import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/utils/auth';

// Database configuration
const connectionString = `${process.env.DATABASE_URL}`;
const connectionStringDev = `${process.env.DATABASE_URL_DEV}`;
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: isProduction ? connectionString : connectionStringDev,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

const adapter = new PrismaPg(pool);

// Create a new Prisma Client instance for seeding
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`🌱 Starting database seeding in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);

  // ==================== ADMINS ====================
  console.log('\n📋 Seeding Admins...');
  const adminPassword = await hashPassword('admin123');

  const admin1 = await prisma.admin.upsert({
    where: { email: 'admin@buck.com' },
    update: {},
    create: {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@buck.com',
      password: adminPassword,
    },
  });

  const admin2 = await prisma.admin.upsert({
    where: { email: 'superadmin@buck.com' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      email: 'superadmin@buck.com',
      password: adminPassword,
    },
  });

  console.log(`✅ Created ${2} admins`);

  // ==================== CREATORS ====================
  console.log('\n🎨 Seeding Creators...');
  const creatorPassword = await hashPassword('creator123');

  const creator1 = await prisma.user.upsert({
    where: { email: 'john@buck.com' },
    update: {},
    create: {
      name: 'John Fitness',
      username: 'johnfitness',
      email: 'john@buck.com',
      password: creatorPassword,
      role: UserRole.CREATOR,
      bio: 'Professional fitness trainer specializing in HIIT and strength training. 10+ years experience.',
      avatar: 'https://i.pravatar.cc/150?img=12',
      subscriptionPrice: 29.99,
      stripe_connected: true,
      stripe_onboarding_completed: true,
    },
  });

  const creator2 = await prisma.user.upsert({
    where: { email: 'sarah@buck.com' },
    update: {},
    create: {
      name: 'Sarah Yoga',
      username: 'sarahyoga',
      email: 'sarah@buck.com',
      password: creatorPassword,
      role: UserRole.CREATOR,
      bio: 'Certified yoga instructor. Bringing peace and flexibility to your life.',
      avatar: 'https://i.pravatar.cc/150?img=5',
      subscriptionPrice: 24.99,
      stripe_connected: true,
      stripe_onboarding_completed: true,
    },
  });

  const creator3 = await prisma.user.upsert({
    where: { email: 'mike@buck.com' },
    update: {},
    create: {
      name: 'Mike CrossFit',
      username: 'mikecrossfit',
      email: 'mike@buck.com',
      password: creatorPassword,
      role: UserRole.CREATOR,
      bio: 'CrossFit Level 3 trainer. Push your limits with me!',
      avatar: 'https://i.pravatar.cc/150?img=33',
      subscriptionPrice: 34.99,
      stripe_connected: true,
      stripe_onboarding_completed: true,
    },
  });

  const creator4 = await prisma.user.upsert({
    where: { email: 'emma@buck.com' },
    update: {},
    create: {
      name: 'Emma Pilates',
      username: 'emmapilates',
      email: 'emma@buck.com',
      password: creatorPassword,
      role: UserRole.CREATOR,
      bio: 'Pilates expert focusing on core strength and posture correction.',
      avatar: 'https://i.pravatar.cc/150?img=9',
      subscriptionPrice: 27.99,
      stripe_connected: false,
      stripe_onboarding_completed: false,
    },
  });

  console.log(`✅ Created ${4} creators`);

  // ==================== MEMBERS ====================
  console.log('\n👥 Seeding Members...');
  const memberPassword = await hashPassword('member123');

  const member1 = await prisma.user.upsert({
    where: { email: 'alex@buck.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      username: 'alexj',
      email: 'alex@buck.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      bio: 'Fitness enthusiast looking to get in shape!',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'lisa@buck.com' },
    update: {},
    create: {
      name: 'Lisa Chen',
      username: 'lisachen',
      email: 'lisa@buck.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      bio: 'Yoga lover and wellness advocate.',
      avatar: 'https://i.pravatar.cc/150?img=20',
    },
  });

  const member3 = await prisma.user.upsert({
    where: { email: 'david@buck.com' },
    update: {},
    create: {
      name: 'David Martinez',
      username: 'davidm',
      email: 'david@buck.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      bio: 'CrossFit newbie, ready to transform!',
      avatar: 'https://i.pravatar.cc/150?img=25',
    },
  });

  const member4 = await prisma.user.upsert({
    where: { email: 'rachel@buck.com' },
    update: {},
    create: {
      name: 'Rachel Green',
      username: 'rachelg',
      email: 'rachel@buck.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      avatar: 'https://i.pravatar.cc/150?img=30',
    },
  });

  console.log(`✅ Created ${4} members`);

  // ==================== FOLLOWS ====================
  console.log('\n💫 Seeding Follows...');

  const follows = [
    { followerId: member1.id, followedId: creator1.id },
    { followerId: member1.id, followedId: creator2.id },
    { followerId: member2.id, followedId: creator2.id },
    { followerId: member2.id, followedId: creator4.id },
    { followerId: member3.id, followedId: creator1.id },
    { followerId: member3.id, followedId: creator3.id },
    { followerId: member4.id, followedId: creator1.id },
    { followerId: member4.id, followedId: creator2.id },
    { followerId: member4.id, followedId: creator3.id },
  ];

  for (const follow of follows) {
    await prisma.follow.upsert({
      where: {
        followerId_followedId: {
          followerId: follow.followerId,
          followedId: follow.followedId,
        },
      },
      update: {},
      create: follow,
    });
  }

  console.log(`✅ Created ${follows.length} follows`);

  // ==================== SUBSCRIPTIONS ====================
  console.log('\n💳 Seeding Subscriptions...');

  const subscriptions = [
    {
      creatorId: creator1.id,
      memberId: member1.id,
      fee: creator1.subscriptionPrice!,
      status: 'active',
      stripeSubscriptionId: 'sub_mock_' + Math.random().toString(36).substring(7),
    },
    {
      creatorId: creator2.id,
      memberId: member1.id,
      fee: creator2.subscriptionPrice!,
      status: 'active',
      stripeSubscriptionId: 'sub_mock_' + Math.random().toString(36).substring(7),
    },
    {
      creatorId: creator2.id,
      memberId: member2.id,
      fee: creator2.subscriptionPrice!,
      status: 'active',
      stripeSubscriptionId: 'sub_mock_' + Math.random().toString(36).substring(7),
    },
    {
      creatorId: creator1.id,
      memberId: member3.id,
      fee: creator1.subscriptionPrice!,
      status: 'active',
      stripeSubscriptionId: 'sub_mock_' + Math.random().toString(36).substring(7),
    },
    {
      creatorId: creator3.id,
      memberId: member3.id,
      fee: creator3.subscriptionPrice!,
      status: 'cancelled',
      stripeSubscriptionId: 'sub_mock_' + Math.random().toString(36).substring(7),
      endDate: new Date('2025-01-01'),
    },
  ];

  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: {
        creatorId_memberId: {
          creatorId: sub.creatorId,
          memberId: sub.memberId,
        },
      },
      update: {},
      create: sub,
    });
  }

  console.log(`✅ Created ${subscriptions.length} subscriptions`);

  // ==================== STREAMS ====================
  console.log('\n🎥 Seeding Streams...');

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const stream1 = await prisma.stream.create({
    data: {
      title: 'Morning HIIT Blast',
      description: '30-minute high-intensity interval training to kickstart your day!',
      workoutType: 'HIIT',
      thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 30 * 60 * 1000),
      isLive: false,
      replayUrl: 'https://example.com/replays/stream1.m3u8',
      viewerCount: 145,
      creatorId: creator1.id,
    },
  });

  const stream2 = await prisma.stream.create({
    data: {
      title: 'Relaxing Evening Yoga Flow',
      description: 'Unwind with this gentle yoga session perfect for beginners.',
      workoutType: 'Yoga',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 45 * 60 * 1000),
      isLive: false,
      replayUrl: 'https://example.com/replays/stream2.m3u8',
      viewerCount: 89,
      creatorId: creator2.id,
    },
  });

  const stream3 = await prisma.stream.create({
    data: {
      title: 'CrossFit WOD - Beast Mode',
      description: 'Intense CrossFit workout of the day. Are you ready?',
      workoutType: 'CrossFit',
      thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      startTime: now,
      isLive: true,
      viewerCount: 67,
      creatorId: creator3.id,
    },
  });

  const stream4 = await prisma.stream.create({
    data: {
      title: 'Core Strength Pilates',
      description: 'Build a strong core with this targeted Pilates session.',
      workoutType: 'Pilates',
      thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      startTime: tomorrow,
      isLive: false,
      viewerCount: 0,
      creatorId: creator4.id,
    },
  });

  const stream5 = await prisma.stream.create({
    data: {
      title: 'Full Body Strength Training',
      description: 'Complete strength workout targeting all major muscle groups.',
      workoutType: 'Strength',
      thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 60 * 60 * 1000),
      isLive: false,
      replayUrl: 'https://example.com/replays/stream5.m3u8',
      viewerCount: 203,
      creatorId: creator1.id,
    },
  });

  console.log(`✅ Created ${5} streams`);

  // ==================== STREAM CHATS ====================
  console.log('\n💬 Seeding Stream Chats...');

  const chats = [
    { streamId: stream1.id, userId: member1.id, message: 'Great workout! 💪', timestamp: new Date(twoDaysAgo.getTime() + 10 * 60 * 1000) },
    { streamId: stream1.id, userId: creator1.id, message: 'Thanks for joining! Keep pushing!', timestamp: new Date(twoDaysAgo.getTime() + 11 * 60 * 1000) },
    { streamId: stream1.id, userId: member3.id, message: 'This is intense! 🔥', timestamp: new Date(twoDaysAgo.getTime() + 15 * 60 * 1000) },
    { streamId: stream2.id, userId: member2.id, message: 'So relaxing, thank you!', timestamp: new Date(yesterday.getTime() + 20 * 60 * 1000) },
    { streamId: stream2.id, userId: creator2.id, message: 'Glad you enjoyed it! 🧘‍♀️', timestamp: new Date(yesterday.getTime() + 21 * 60 * 1000) },
    { streamId: stream3.id, userId: member3.id, message: 'Let\'s go! 💯', timestamp: new Date(now.getTime() + 5 * 60 * 1000) },
    { streamId: stream3.id, userId: member1.id, message: 'Crushing it!', timestamp: new Date(now.getTime() + 8 * 60 * 1000) },
    { streamId: stream3.id, userId: creator3.id, message: 'You got this team!', timestamp: new Date(now.getTime() + 10 * 60 * 1000) },
  ];

  for (const chat of chats) {
    await prisma.streamChat.create({
      data: chat,
    });
  }

  console.log(`✅ Created ${chats.length} stream chats`);

  // ==================== TIP TRANSACTIONS ====================
  console.log('\n💰 Seeding Tip Transactions...');

  const tips = [
    {
      session_id: 'cs_test_' + Math.random().toString(36).substring(7),
      creator_id: creator1.id,
      member_id: member1.id,
      livestream_id: stream1.id,
      buck_amount: 10.00,
      amount_cents: 1000,
      platform_fee_cents: 100,
      creator_receives_cents: 900,
      status: 'completed',
      stripe_payment_intent_id: 'pi_' + Math.random().toString(36).substring(7),
      completed_at: new Date(twoDaysAgo.getTime() + 25 * 60 * 1000),
      metadata: { message: 'Great session!' },
    },
    {
      session_id: 'cs_test_' + Math.random().toString(36).substring(7),
      creator_id: creator2.id,
      member_id: member2.id,
      livestream_id: stream2.id,
      buck_amount: 5.00,
      amount_cents: 500,
      platform_fee_cents: 50,
      creator_receives_cents: 450,
      status: 'completed',
      stripe_payment_intent_id: 'pi_' + Math.random().toString(36).substring(7),
      completed_at: new Date(yesterday.getTime() + 40 * 60 * 1000),
      metadata: { message: 'Thank you!' },
    },
    {
      session_id: 'cs_test_' + Math.random().toString(36).substring(7),
      creator_id: creator3.id,
      member_id: member3.id,
      livestream_id: stream3.id,
      buck_amount: 20.00,
      amount_cents: 2000,
      platform_fee_cents: 200,
      creator_receives_cents: 1800,
      status: 'pending',
      metadata: { message: 'Amazing workout!' },
    },
  ];

  for (const tip of tips) {
    await prisma.tipTransaction.create({
      data: tip,
    });
  }

  console.log(`✅ Created ${tips.length} tip transactions`);

  // ==================== FLAGGED CONTENT ====================
  console.log('\n🚩 Seeding Flagged Content...');

  const flaggedChat = await prisma.streamChat.findFirst({
    where: { streamId: stream3.id },
  });

  if (flaggedChat) {
    await prisma.flaggedContent.create({
      data: {
        senderId: member1.id,
        flaggedMsgId: flaggedChat.id,
        reporterId: member2.id,
        reporterComment: 'Inappropriate language',
        livestreamId: stream3.id,
      },
    });

    await prisma.flaggedContent.create({
      data: {
        senderId: member3.id,
        reporterId: member1.id,
        reporterComment: 'Spam content',
        livestreamId: stream1.id,
      },
    });

    console.log(`✅ Created ${2} flagged content entries`);
  }

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database seeding completed successfully!');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   • Admins: 2`);
  console.log(`   • Creators: 4`);
  console.log(`   • Members: 4`);
  console.log(`   • Follows: ${follows.length}`);
  console.log(`   • Subscriptions: ${subscriptions.length}`);
  console.log(`   • Streams: 5`);
  console.log(`   • Stream Chats: ${chats.length}`);
  console.log(`   • Tip Transactions: ${tips.length}`);
  console.log(`   • Flagged Content: 2`);

  console.log('\n🔐 Test Credentials:');
  console.log('   Admin:   admin@buck.com / admin123');
  console.log('   Creator: john@buck.com / creator123');
  console.log('   Member:  alex@buck.com / member123');
  console.log('\n' + '='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
