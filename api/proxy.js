const axios = require('axios');

export default async function handler(req, res) {
    const { url: targetUrl } = req.query;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    // URL ফরম্যাট ঠিক করা
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http')) {
        finalUrl = 'https://' + finalUrl;
    }

    try {
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            responseType: 'text',
            timeout: 10000, // ১০ সেকেন্ডের বেশি সময় নিলে কেটে দিবে
            validateStatus: () => true 
        });

        // ব্রাউজার সিকিউরিটি হেডারগুলো রিমুভ করা যাতে iframe এ লোড হয়
        const headers = { ...response.headers };
        const blockedHeaders = [
            'x-frame-options', 
            'content-security-policy', 
            'content-security-policy-report-only', 
            'strict-transport-security'
        ];
        
        blockedHeaders.forEach(h => delete headers[h]);

        // CORS পলিসি সেট করা
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');

        let html = response.data;
        if (typeof html === 'string') {
            const urlObj = new URL(finalUrl);
            const baseUrl = urlObj.origin;

            // ১. Base Tag ইনজেক্ট করা (সব ছবি এবং স্টাইল লোড করানোর জন্য)
            html = html.replace('<head>', `<head><base href="${baseUrl}/">`);

            // ২. স্ক্রিপ্ট বাইপাস (গুগল/ফেসবুক আইফ্রেম ডিটেক্ট করা বন্ধ করবে)
            html = html.replace(/window\.top/g, 'window.self');
            html = html.replace(/top\.location/g, 'self.location');
            
            // ৩. রিলেটিভ লিঙ্কগুলোকে প্রক্সির মাধ্যমে ঘুরিয়ে দেওয়ার চেষ্টা
            const proxyBase = `/api/proxy?url=`;
            html = html.replace(/href="https?:\/\/([^"]*)"/g, (match, link) => {
                return `href="${proxyBase}${encodeURIComponent('http://' + link)}"`;
            });
        }

        return res.status(response.status).send(html);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
}
