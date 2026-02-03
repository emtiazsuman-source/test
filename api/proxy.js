const axios = require('axios');

export default async function handler(req, res) {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

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
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');

        let html = response.data;
        if (typeof html === 'string') {
            const urlObj = new URL(finalUrl);
            const baseUrl = urlObj.origin;

            // ১. Base Tag ইনজেক্ট করা (সব ছবি এবং স্টাইল লোড করানোর জন্য)
            if (!html.includes('<base')) {
                html = html.replace('<head>', `<head><base href="${baseUrl}/">`);
            }

            // ২. স্ক্রিপ্ট বাইপাস (গুগল/ফেসবুক আইফ্রেম ডিটেক্ট করা বন্ধ করবে)
            html = html.replace(/window\.top/g, 'window.self');
            html = html.replace(/top\.location/g, 'self.location');
            html = html.replace(/window\.parent/g, 'window.self');
            html = html.replace(/parent\.location/g, 'self.location');
            
            // ৩. লিঙ্ক ক্লিক হ্যান্ডলার যোগ করা
            const linkHandler = `
            <script>
                document.addEventListener('click', function(e) {
                    const link = e.target.closest('a');
                    if (link && link.href) {
                        e.preventDefault();
                        const href = link.getAttribute('href');
                        if (href.startsWith('#')) return;
                        if (href.startsWith('javascript:')) return;
                        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
                        
                        let fullUrl = href;
                        if (href.startsWith('/')) {
                            fullUrl = '${baseUrl}' + href;
                        } else if (!href.startsWith('http')) {
                            fullUrl = '${baseUrl}/' + href;
                        }
                        
                        window.parent.location.href = '/api/proxy?url=' + encodeURIComponent(fullUrl);
                    }
                });
                
                // ফর্ম সাবমিশন হ্যান্ডল করা
                document.addEventListener('submit', function(e) {
                    const form = e.target;
                    if (form.tagName === 'FORM') {
                        e.preventDefault();
                        const action = form.getAttribute('action') || window.location.href;
                        const method = (form.getAttribute('method') || 'GET').toUpperCase();
                        
                        let fullAction = action;
                        if (action.startsWith('/')) {
                            fullAction = '${baseUrl}' + action;
                        } else if (!action.startsWith('http')) {
                            fullAction = '${baseUrl}/' + action;
                        }
                        
                        if (method === 'GET') {
                            const formData = new FormData(form);
                            const params = new URLSearchParams(formData);
                            const urlWithParams = fullAction + (fullAction.includes('?') ? '&' : '?') + params.toString();
                            window.parent.location.href = '/api/proxy?url=' + encodeURIComponent(urlWithParams);
                        }
                    }
                });
            </script>`;
            
            // ৪. স্ক্রিপ্ট যোগ করা (head বা body তে)
            if (html.includes('</head>')) {
                html = html.replace('</head>', linkHandler + '</head>');
            } else if (html.includes('</body>')) {
                html = html.replace('</body>', linkHandler + '</body>');
            } else {
                html += linkHandler;
            }
        }

        return res.status(response.status).send(html);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
}
