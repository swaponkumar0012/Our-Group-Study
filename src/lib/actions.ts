'use server';

import { cookies } from 'next/headers';
import prisma from './db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function login(role: string, username: string) {
    try {
        const user = await prisma.user.findFirst({
            where: { username, role },
        });

        if (!user) {
            return { error: 'ID not found or invalid role. Please register first.' };
        }

        const cookieStore = await cookies();
        cookieStore.set('session', JSON.stringify({
            id: user.id,
            name: user.name,
            role: user.role,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
    } catch (e: any) {
        console.error("Login error:", e);
        return { error: 'An unexpected error occurred: ' + (e.message || 'Unknown error') };
    }

    redirect('/dashboard');
}

export async function register(role: string, username: string, name: string, password?: string) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return { error: 'Username / ID already exists. Please choose another.' };
        }

        const user = await prisma.user.create({
            data: {
                username,
                name,
                role,
                password: password || 'password123',
            },
        });

        const cookieStore = await cookies();
        cookieStore.set('session', JSON.stringify({
            id: user.id,
            name: user.name,
            role: user.role,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
    } catch (e: any) {
        console.error("Registration error:", e);
        return { error: 'An unexpected error occurred: ' + (e.message || 'Unknown error') };
    }

    redirect('/dashboard');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    redirect('/login');
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        if (!session) return null;
        return JSON.parse(session.value);
    } catch (e) {
        console.error("Session parsing error:", e);
        return null;
    }
}

export async function createGroup(
    name: string,
    pdfUrl?: string,
    examDuration?: number,
    pdfViewLimit?: number,
    questionPattern?: string,
    questions?: any[]
) {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
        throw new Error('Only teachers can create groups');
    }

    const group = await prisma.group.create({
        data: {
            name,
            teacherId: session.id,
            pdfUrl,
            examDuration: examDuration || 30,
            pdfViewLimit: pdfViewLimit || 15,
            questionPattern: questionPattern || 'MCQ',
        } as any,
    });

    // Create the associated quiz if questions are provided
    if (questions && questions.length > 0) {
        await prisma.quiz.create({
            data: {
                groupId: group.id,
                title: `${name} Quiz`,
                questions: JSON.stringify(questions),
                examTimeSeconds: (examDuration || 30) * 60,
            }
        });
    }

    return group;
}

export async function deleteGroup(id: string) {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
        throw new Error('Only teachers can delete groups');
    }

    // Verify ownership
    const group = await prisma.group.findUnique({
        where: { id }
    });

    if (!group || group.teacherId !== session.id) {
        throw new Error('You do not have permission to delete this group');
    }

    await prisma.group.delete({
        where: { id }
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function getGroups() {
    try {
        const session = await getSession();
        if (!session) return [];

        if (session.role === 'TEACHER') {
            return await prisma.group.findMany({
                where: { teacherId: session.id },
                include: { quizzes: true },
            });
        } else {
            // For now, students see all groups since we don't have join logic yet
            return await prisma.group.findMany({
                include: { quizzes: true },
            });
        }
    } catch (e) {
        console.error("Error fetching groups:", e);
        return [];
    }
}

export async function getGroup(id: string) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    return (await prisma.group.findUnique({
        where: { id },
        include: { quizzes: true, messages: { include: { sender: true } }, teacher: true },
    })) as any;
}

export async function getLeaderboard(groupId?: string) {
    console.log('Fetching leaderboard for group:', groupId || 'Global');
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            responses: {
                include: { quiz: true }
            }
        },
    });

    console.log(`Found ${students.length} students to rank.`);

    const rankedStudents = students
        .map((s) => {
            // Filter responses by groupId if needed
            const relevantResponses = groupId
                ? s.responses.filter(r => r.quiz?.groupId === groupId)
                : s.responses;

            return {
                id: s.id,
                name: s.name,
                totalScore: relevantResponses.reduce((acc, r) => acc + r.score, 0),
                correctCount: relevantResponses.reduce((acc, r) => acc + ((r as any).correctCount || 0), 0),
                totalCount: relevantResponses.reduce((acc, r) => acc + ((r as any).totalCount || 0), 0),
                responseCount: relevantResponses.length
            };
        })
        .filter(s => {
            // If filtering by group, show students who have at least one response in that group
            // If global, show everyone who has at least one response overall
            return groupId ? s.responseCount > 0 : s.responseCount > 0;
        })
        .sort((a, b) => b.totalScore - a.totalScore);

    console.log(`Found ${rankedStudents.length} students with responses.`);
    if (groupId) {
        console.log(`Group ${groupId} details:`, rankedStudents.map(s => `${s.name}: ${s.totalScore} pts (${s.responseCount} responses)`));
    }
    return rankedStudents;
}

export async function getMessages() {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    if (session.role === 'TEACHER') {
        return prisma.message.findMany({
            where: { group: { teacherId: session.id } },
            include: { group: true, sender: true },
            orderBy: { createdAt: 'desc' },
        });
    } else {
        return prisma.message.findMany({
            where: { senderId: session.id },
            include: { group: true, sender: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
export async function sendMessage(groupId: string, content: string) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    return prisma.message.create({
        data: {
            groupId,
            senderId: session.id,
            content,
        },
        include: { sender: true }
    });
}

export async function submitQuizResponse(quizId: string, score: number, correctCount: number, totalCount: number) {
    const session = await getSession();
    console.log('--- SERVER ACTION: submitQuizResponse CALLED ---');
    console.log(`Action Args: quizId=${quizId}, score=${score}, correctCount=${correctCount}, totalCount=${totalCount}`);
    console.log(`Session: User=${session?.name}, Role=${session?.role}`);

    if (!session || session.role !== 'STUDENT') {
        console.warn('Action Blocked: Only students can submit');
        throw new Error('Only students can submit quiz responses');
    }

    const existing = await prisma.response.findFirst({
        where: { quizId, studentId: session.id }
    });

    if (existing) {
        console.log('Updating existing response:', (existing as any).id);
        await (prisma.response as any).update({
            where: { id: (existing as any).id },
            data: { score, correctCount, totalCount }
        });
    } else {
        console.log('Creating new response record');
        await (prisma.response as any).create({
            data: {
                quizId,
                studentId: session.id,
                score,
                correctCount,
                totalCount,
            },
        });
    }

    revalidatePath('/dashboard/leaderboard');
    return { success: true };
}
