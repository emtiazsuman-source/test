export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Ei code-ti shobshomoy "Access Denied" page dekhabe
  const siteUrl = new URL(request.url).origin;
  const deniedResponse = await fetch(`${siteUrl}/access-denied.html`);
  return new Response(deniedResponse.body, {
    status: 403,
    headers: { 'Content-Type': 'text/html' },
  });
}
