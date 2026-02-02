const axios = require('axios');

export default async function handler(req, res) {
    const { url: targetUrl } = req.query;

    if (!targetUrl) return res.status(400).send('URL is required');

    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;

    try {
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            responseType: 'text',
            validateStatus: () => true,
            maxRedirects: 5
        });

        // সিকিউরিটি হেডারগুলো মুছে ফেলা যাতে আইফ্রেম ব্লক না হয়
        const headers = { ...response.headers };
        ['x-frame-options', 'content-security-policy', 'x-content-type-options', 'strict-transport-security'].forEach(h => delete headers[h]);

        res.set(headers);
        res.setHeader('Access-Control-Allow-Origin', '*');

        let html = response.data;
        if (typeof html === 'string') {
            const urlObj = new URL(finalUrl);
            const origin = urlObj.origin;

            // ১. Base Tag ইনজেক্ট করা
            html = html.replace('<head>', `<head><base href="${origin}/">`);

            // ২. স্ক্রিপ্ট বাইপাস (গুগল/ফেসবুকের ফ্রেম ব্রেকার প্রতিরোধ)
            html = html.replace(/window\.top/g, 'window.self');
            html = html.replace(/top\.location/g, 'self.location');

            // ৩. লিংকগুলোকে প্রক্সির ভেতর দিয়ে পাঠানো (সব লিংকের জন্য)
            html = html.replace(/href="https?:\/\/([^"]*)"/g, (match, link) => {
                return `href="/api/proxy?url=${encodeURIComponent('http://' + link)}"`;
            });
        }

        res.status(response.status).send(html);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
}
