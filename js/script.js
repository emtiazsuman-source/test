const axios = require('axios');

export default async function handler(req, res) {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            responseType: 'text',
            validateStatus: () => true
        });

        // ব্রাউজারকে বিভ্রান্ত করতে সিকিউরিটি হেডারগুলো ডিলিট করা
        const headers = { ...response.headers };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        delete headers['content-security-policy-report-only'];
        delete headers['cross-origin-resource-policy'];

        res.set(headers);
        
        // HTML এর ভেতরের লিঙ্কগুলোকে কিছুটা মডিফাই করার চেষ্টা (ঐচ্ছিক কিন্তু কার্যকরী)
        let html = response.data;
        if (typeof html === 'string') {
            // এটি গুগলকে আইফ্রেম ডিটেক্ট করতে কিছুটা বাধা দেয়
            html = html.replace(/window\.top === window\.self/g, 'true');
            html = html.replace(/if\(top!==self\)/g, 'if(false)');
        }

        res.status(response.status).send(html);
    } catch (error) {
        res.status(500).send(`Error fetching the site: ${error.message}`);
    }
}
