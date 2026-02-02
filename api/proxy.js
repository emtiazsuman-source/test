// api/proxy.js
const https = require('https');
const http = require('http');
const url = require('url');

export default async function handler(req, res) {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    // টার্গেট URL পার্স করা
    const parsedUrl = url.parse(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    };

    const proxyReq = protocol.request(options, (proxyRes) => {
        // টার্গেট সাইটের হেডারগুলো কপি করা (CORS বাইপাস করার জন্য)
        const headers = { ...proxyRes.headers };
        
        // X-Frame-Options রিমুভ করা যাতে iframe এ লোড হয়
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        
        // হেডার সেট করা
        res.writeHead(proxyRes.statusCode, headers);
        
        // ডেটা পাইপ করা
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        res.status(500).send(`Error: ${e.message}`);
    });

    proxyReq.end();
}
