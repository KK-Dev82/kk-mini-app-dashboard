import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');

  const logoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?` +
    `client_id=${process.env.AUTH0_CLIENT_ID}&` +
    `returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL || '')}`;

  return NextResponse.redirect(logoutUrl);
}
