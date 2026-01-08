import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const nodes = await prisma.node.findMany({
        orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(nodes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // For 'member' type, we extract details. For 'branch', we look at title.
    const memberDetails = body.memberDetails || {};

    const newNode = await prisma.node.create({
      data: {
        type: body.type,
        title: body.title,
        name: memberDetails.name,
        bio: memberDetails.bio,
        role: memberDetails.role,
        imageUrl: memberDetails.imageUrl,
        parentId: body.parentId,
      },
    });
    return NextResponse.json(newNode);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }
}
