import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check Auth
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updatedNode = await prisma.node.update({
      where: { id },
      data: {
        title: body.title,
        // Add other fields if editable later
      },
    });
    return NextResponse.json(updatedNode);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check Auth
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    // onDelete: Cascade in schema should handle children
    await prisma.node.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }
}
