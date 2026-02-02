const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            responseType: 'text',
            validateStatus: () => true,
            maxRedirects: 5
        });

        // সিকিউরিটি হেডার মুছে ফেলা যাতে iframe ব্লক না হয়
        const headers = { ...response.headers };
        const blockedHeaders = [
            'x-frame-options', 
            'content-security-policy', 
            'content-security-policy-report-only', 
            'x-content-type-options',
            'strict-transport-security'
        ];
        blockedHeaders.forEach(h => delete headers[h]);

        res.set(headers);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');

        let html = response.data;
        if (typeof html === 'string') {
            const urlObj = new URL(targetUrl);
            const baseUrl = urlObj.origin;

            // ১. Base Tag ইনজেক্ট করা যাতে স্টাইল/ছবি লোড হয়
            html = html.replace('<head>', `<head><base href="${baseUrl}/">`);

            // ২. স্ক্রিপ্ট বাইপাস (গুগল/ফেসবুকের ফ্রেম ব্রেকার প্রতিরোধ)
            html = html.replace(/window\.top/g, 'window.self');
            html = html.replace(/top\.location/g, 'self.location');
            
            // ৩. লিংকগুলোকে প্রক্সির ভেতর দিয়ে পাঠানোর চেষ্টা
            const proxyEndpoint = `/api/proxy?url=`;
            html = html.replace(/href="https?:\/\/([^"]*)"/g, (match, link) => {
                return `href="${proxyEndpoint}${encodeURIComponent('http://' + link)}"`;
            });
        }

        return res.status(response.status).send(html);

    } catch (error) {
        return res.status(500).send(`Error: ${error.message}`);
    }
}
