const axios = require('axios');
const url = require('url');

export default async function handler(req, res) {
    const targetUrl = req.query.url;

    // URL না থাকলে এরর দেখাবে
    if (!targetUrl) {
        return res.status(400).send('দয়া করে একটি URL দিন।');
    }

    // URL এর শুরুতে http/https না থাকলে যোগ করে নেওয়া
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http')) {
        finalUrl = 'https://' + finalUrl;
    }

    try {
        // ১. টার্গেট সাইট থেকে ডেটা আনা
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            responseType: 'text', // আমরা টেক্সট হিসেবে নিয়ে এডিট করব
            validateStatus: () => true // সব স্ট্যাটাস কোড অ্যালাউ করা
        });

        // ২. সিকিউরিটি হেডার রিমুভ করা (যাতে iframe এ লোড হয়)
        const headers = { ...response.headers };
        const blockedHeaders = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'x-content-type-options'];
        blockedHeaders.forEach(h => delete headers[h]);

        res.set(headers);
        res.setHeader('Access-Control-Allow-Origin', '*');

        // ৩. HTML এর ভেতরের লিংকগুলো ঠিক করা (URL Rewriting)
        let html = response.data;

        if (typeof html === 'string') {
            const parsedUrl = url.parse(finalUrl);
            const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
            const currentProxyUrl = `/api/proxy?url=`; // আপনার প্রক্সির পাথ

            // (ক) <base> ট্যাগ ইনজেক্ট করা যাতে রিলেটিভ লিংক কাজ করে
            const baseTag = `<base href="${baseUrl}/">`;
            html = html.replace('<head>', `<head>${baseTag}`);

            // (খ) লিংকগুলোকে প্রক্সির মাধ্যমে ঘুরিয়ে দেওয়া (Regex ব্যবহার করে)
            // href="...", src="...", action="..."
            const regex = /(href|src|action)=["']([^"']+)["']/g;
            
            html = html.replace(regex, (match, attr, link) => {
                // যদি লিংকটি http দিয়ে শুরু হয়, তাহলে তাকে প্রক্সির ভেতর দিয়ে পাঠাও
                if (link.startsWith('http')) {
                    return `${attr}="${currentProxyUrl}${encodeURIComponent(link)}"`;
                }
                // বাকিরা base ট্যাগের কারণে অটোমেটিক কাজ করবে
                return match;
            });

            // (গ) ফ্রেম বাস্টিং স্ক্রিপ্ট অকেজো করা (যাতে গুগল রিডাইরেক্ট না করে)
            html = html.replace(/window\.top/g, 'window.self');
            html = html.replace(/top\.location/g, 'self.location');
        }

        // ৪. ফাইনাল HTML পাঠানো
        res.status(response.status).send(html);

    } catch (error) {
        res.status(500).send(`Error loading site: ${error.message}`);
    }
}
