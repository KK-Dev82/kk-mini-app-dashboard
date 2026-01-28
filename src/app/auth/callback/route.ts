import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('=== AUTH CALLBACK START ===');
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  console.log('Auth code:', code ? 'received' : 'missing');

  if (!code) {
    console.log('No code, redirecting to login');
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/Login`);
  }

  try {
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.AUTH0_BASE_URL}/auth/callback`,
      }),
    });

    const tokens = await tokenResponse.json();
    console.log('Auth0 tokens received:', tokens);
    
    const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    const user = await userResponse.json();
    console.log('Auth0 user info:', user);

    console.log('Calling backend callback with user:', user);
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });

    console.log('Backend response status:', backendResponse.status);
    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('Backend response data:', data);
      const { access_token } = data;
      
      if (access_token) {
        const cookieStore = await cookies();
        cookieStore.set('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
        console.log('✅ Cookie set successfully');
      } else {
        console.log('❌ No access_token in backend response');
      }
    } else {
      console.error('Backend callback failed:', await backendResponse.text());
      // Store Auth0 token temporarily
      const cookieStore = await cookies();
      cookieStore.set('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/home`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/Login`);
  }
}
