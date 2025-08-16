// Node.js fetch is available in Vercel Edge Functions
import { fetch } from 'node-fetch';

export default async function handler(request, response) {
  // অ্যাপের মধ্যে যে User-Agent এবং Token দিয়েছিলেন, সেগুলোই এখানে লিখুন
  const EXPECTED_USER_AGENT = 'MyUniqueApp/1.0';
  const SECRET_TOKEN = 'YOUR_SUPER_SECRET_TOKEN_67890';

  // অ্যাপ থেকে পাঠানো হেডারগুলো নেওয়া হচ্ছে
  const userAgent = request.headers['user-agent'];
  const authHeader = request.headers['authorization'];
  
  const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  // আপনার ওয়েবসাইটের আসল URL (Vercel deployment URL)
  const siteUrl = `https://${request.headers['x-vercel-deployment-url']}`;

  // User-Agent এবং Token চেক করা হচ্ছে
  if (userAgent === EXPECTED_USER_AGENT && authToken === SECRET_TOKEN) {
    // যদি সবকিছু সঠিক থাকে, তাহলে index.html ফাইলটি দেখানো হবে
    const htmlContent = await fetch(`${siteUrl}/index.html`).then(res => res.text());
    response.status(200).setHeader('Content-Type', 'text/html').send(htmlContent);
  } else {
    // যদি কোনো একটি ভুল হয়, তাহলে access-denied.html পেজটি দেখানো হবে
    const deniedContent = await fetch(`${siteUrl}/access-denied.html`).then(res => res.text());
    response.status(403).setHeader('Content-Type', 'text/html').send(deniedContent);
  }
}
