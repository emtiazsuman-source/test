export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // অ্যাপের মধ্যে যে User-Agent এবং Token দিয়েছিলেন, সেগুলোই এখানে লিখুন
  const EXPECTED_USER_AGENT = 'MyUniqueApp/1.0';
  const SECRET_TOKEN = 'YOUR_SUPER_SECRET_TOKEN_67890';

  // অ্যাপ থেকে পাঠানো হেডারগুলো নেওয়া হচ্ছে
  const userAgent = request.headers.get('user-agent');
  const authHeader = request.headers.get('authorization');
  
  const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  // আপনার ওয়েবসাইটের আসল URL (Vercel deployment URL)
  const siteUrl = new URL(request.url).origin;

  // User-Agent এবং Token চেক করা হচ্ছে
  if (userAgent === EXPECTED_USER_AGENT && authToken === SECRET_TOKEN) {
    // যদি সবকিছু সঠিক থাকে, তাহলে index.html ফাইলটি দেখানো হবে
    const htmlResponse = await fetch(`${siteUrl}/index.html`);
    return new Response(htmlResponse.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } else {
    // যদি কোনো একটি ভুল হয়, তাহলে access-denied.html পেজটি দেখানো হবে
    const deniedResponse = await fetch(`${siteUrl}/access-denied.html`);
    return new Response(deniedResponse.body, {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
