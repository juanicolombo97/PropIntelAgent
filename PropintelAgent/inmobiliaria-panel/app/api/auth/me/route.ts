import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await isAuthenticated(request);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: { username: user.username, role: user.role }
  });
}