import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const admins = [
      { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
      { email: process.env.ADMIN_EMAIL_2, password: process.env.ADMIN_PASSWORD_2 }
    ];

    const isValid = admins.some(admin => admin.email === email && admin.password === password);

    if (isValid) {
      const cookieStore = await cookies();
      
      // Set the HTTP-only auth cookie
      cookieStore.set('admin_token', 'session_active', { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 // 1 day
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
