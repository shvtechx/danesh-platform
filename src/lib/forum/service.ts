import { prisma } from '@/lib/db';

const DEFAULT_FORUM_CATEGORIES = [
  {
    name: 'Mathematics',
    nameFA: 'ریاضی',
    description: 'Algebra, geometry, problem solving, and numeracy support.',
    icon: '📐',
    order: 1,
  },
  {
    name: 'Science',
    nameFA: 'علوم',
    description: 'Physics, chemistry, biology, and scientific inquiry.',
    icon: '🧪',
    order: 2,
  },
  {
    name: 'English',
    nameFA: 'زبان انگلیسی',
    description: 'Grammar, reading, writing, vocabulary, and speaking.',
    icon: '🌍',
    order: 3,
  },
  {
    name: 'Literature',
    nameFA: 'ادبیات',
    description: 'Reading response, writing craft, and literary analysis.',
    icon: '📚',
    order: 4,
  },
  {
    name: 'General',
    nameFA: 'عمومی',
    description: 'Study strategies, motivation, and community help.',
    icon: '💬',
    order: 5,
  },
] as const;

function getDisplayName(user: {
  email: string | null;
  profile?: {
    displayName: string | null;
    firstName: string;
    lastName: string;
  } | null;
}) {
  if (user.profile?.displayName?.trim()) {
    return user.profile.displayName.trim();
  }

  const fullName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'Learner';
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'L';
}

function getColorClass(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('math')) return 'bg-blue-500';
  if (normalized.includes('science')) return 'bg-green-500';
  if (normalized.includes('english')) return 'bg-purple-500';
  if (normalized.includes('literature')) return 'bg-orange-500';
  return 'bg-pink-500';
}

function getPreview(content: string | null | undefined) {
  if (!content) {
    return '';
  }

  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

export async function ensureForumCategories() {
  let categories = await prisma.forumCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  if (categories.length === 0) {
    await prisma.$transaction(
      DEFAULT_FORUM_CATEGORIES.map((category) =>
        prisma.forumCategory.create({
          data: category,
        }),
      ),
    );

    categories = await prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  return categories;
}

export async function getForumOverview(currentUserId?: string | null) {
  const categories = await ensureForumCategories();

  const threads = await prisma.forumThread.findMany({
    include: {
      category: true,
      author: {
        include: {
          profile: true,
        },
      },
      posts: {
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          votes: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
  });

  const summaries = threads.map((thread) => {
    const rootPost = thread.posts.find((post) => post.parentId === null) ?? thread.posts[0] ?? null;
    const replies = thread.posts.filter((post) => post.parentId !== null);
    const positiveVotes = thread.posts.reduce(
      (sum, post) => sum + post.votes.reduce((voteSum, vote) => voteSum + Math.max(vote.value, 0), 0),
      0,
    );
    const acceptedReply = replies.find((post) => post.isAccepted) ?? null;
    const authorName = getDisplayName(thread.author);
    const lastActivitySource = [...thread.posts.map((post) => post.updatedAt), thread.updatedAt].sort(
      (left, right) => right.getTime() - left.getTime(),
    )[0];

    return {
      id: thread.id,
      authorId: thread.authorId,
      title: thread.title,
      titleFA: thread.titleFA,
      preview: getPreview(rootPost?.content),
      previewFA: getPreview(rootPost?.contentFA || rootPost?.content),
      categoryId: thread.categoryId,
      categoryName: thread.category.name,
      categoryNameFA: thread.category.nameFA,
      categoryColor: getColorClass(thread.category.name),
      author: authorName,
      avatar: getInitials(authorName),
      replies: replies.length,
      views: thread.viewCount,
      likes: positiveVotes,
      solved: thread.status === 'RESOLVED' || Boolean(acceptedReply),
      lastActivityAt: lastActivitySource.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      isMine: currentUserId ? thread.authorId === currentUserId : false,
    };
  });

  const totalReplies = summaries.reduce((sum, thread) => sum + thread.replies, 0);
  const recentContributorCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeMemberIds = new Set<string>();
  const contributorMap = new Map<
    string,
    { id: string; name: string; avatar: string; answers: number; lastActiveAt: number }
  >();

  for (const thread of threads) {
    if (thread.updatedAt.getTime() >= recentContributorCutoff) {
      activeMemberIds.add(thread.authorId);
    }

    for (const post of thread.posts) {
      if (post.updatedAt.getTime() >= recentContributorCutoff) {
        activeMemberIds.add(post.authorId);
      }

      if (post.parentId === null) {
        continue;
      }

      const authorName = getDisplayName(post.author);
      const current = contributorMap.get(post.authorId) ?? {
        id: post.authorId,
        name: authorName,
        avatar: getInitials(authorName),
        answers: 0,
        lastActiveAt: 0,
      };

      current.answers += 1;
      current.lastActiveAt = Math.max(current.lastActiveAt, post.updatedAt.getTime());
      contributorMap.set(post.authorId, current);
    }
  }

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      nameFA: category.nameFA,
      icon: category.icon,
      color: getColorClass(category.name),
      count: summaries.filter((thread) => thread.categoryId === category.id).length,
    })),
    threads: summaries,
    stats: {
      totalDiscussions: summaries.length,
      solvedDiscussions: summaries.filter((thread) => thread.solved).length,
      activeMembers: activeMemberIds.size,
      totalReplies,
    },
    topContributors: Array.from(contributorMap.values())
      .sort((left, right) => right.answers - left.answers || right.lastActiveAt - left.lastActiveAt)
      .slice(0, 5)
      .map(({ lastActiveAt, ...contributor }) => contributor),
  };
}

export async function createForumThread(input: {
  userId: string;
  categoryId: string;
  title: string;
  content: string;
  locale?: string;
}) {
  await ensureForumCategories();

  const category = await prisma.forumCategory.findUnique({
    where: { id: input.categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const isPersian = input.locale === 'fa';

  const thread = await prisma.forumThread.create({
    data: {
      categoryId: input.categoryId,
      authorId: input.userId,
      title: input.title,
      titleFA: isPersian ? input.title : null,
      posts: {
        create: {
          authorId: input.userId,
          content: input.content,
          contentFA: isPersian ? input.content : null,
        },
      },
    },
  });

  return thread;
}

export async function deleteForumThread(threadId: string, userId: string) {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.authorId !== userId) {
    throw new Error('You can only delete your own threads');
  }

  await prisma.forumThread.delete({
    where: { id: threadId },
  });
}

export async function getForumThreadDetail(threadId: string) {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      category: true,
      author: {
        include: {
          profile: true,
        },
      },
      posts: {
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          votes: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!thread) {
    return null;
  }

  const rootPost = thread.posts.find((post) => post.parentId === null) ?? thread.posts[0] ?? null;
  const replies = thread.posts
    .filter((post) => post.parentId !== null)
    .map((post) => {
      const authorName = getDisplayName(post.author);
      const positiveVotes = post.votes.reduce((sum, vote) => sum + Math.max(vote.value, 0), 0);

      return {
        id: post.id,
        parentId: post.parentId,
        content: post.content,
        contentFA: post.contentFA,
        isAccepted: post.isAccepted,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        likes: positiveVotes,
        author: {
          id: post.authorId,
          name: authorName,
          avatar: getInitials(authorName),
        },
      };
    });

  const authorName = getDisplayName(thread.author);
  const positiveVotes = thread.posts.reduce(
    (sum, post) => sum + post.votes.reduce((voteSum, vote) => voteSum + Math.max(vote.value, 0), 0),
    0,
  );

  return {
    id: thread.id,
    authorId: thread.authorId,
    title: thread.title,
    titleFA: thread.titleFA,
    category: {
      id: thread.category.id,
      name: thread.category.name,
      nameFA: thread.category.nameFA,
      color: getColorClass(thread.category.name),
    },
    content: rootPost?.content || '',
    contentFA: rootPost?.contentFA,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    views: thread.viewCount,
    likes: positiveVotes,
    solved: thread.status === 'RESOLVED' || replies.some((reply) => reply.isAccepted),
    author: {
      id: thread.authorId,
      name: authorName,
      avatar: getInitials(authorName),
    },
    replies,
  };
}

export async function incrementForumThreadViews(threadId: string) {
  await prisma.forumThread.update({
    where: { id: threadId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}

export async function createForumReply(input: {
  threadId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  locale?: string;
}) {
  const thread = await prisma.forumThread.findUnique({
    where: { id: input.threadId },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.isLocked) {
    throw new Error('Thread is locked');
  }

  const isPersian = input.locale === 'fa';

  return prisma.forumPost.create({
    data: {
      threadId: input.threadId,
      authorId: input.userId,
      parentId: input.parentId || null,
      content: input.content,
      contentFA: isPersian ? input.content : null,
    },
  });
}
