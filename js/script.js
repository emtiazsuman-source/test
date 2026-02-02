document.getElementById('browseBtn').addEventListener('click', loadWebsite);

function loadWebsite() {
    const inputUrl = document.getElementById('urlInput').value;
    const viewer = document.getElementById('viewer');

    if (!inputUrl) {
        alert("দয়া করে একটি URL দিন!");
        return;
    }

    // ইউআরএল ভ্যালিডেশন (http/https না থাকলে যোগ করে নেয়া)
    let formattedUrl = inputUrl;
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        formattedUrl = 'https://' + inputUrl;
    }

    // আমাদের Vercel API কে কল করা হচ্ছে
    // এখানে '/api/proxy' হলো আমাদের ব্যাকএন্ড ফাংশন
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(formattedUrl)}`;

    // আইফ্রেমে লোড করা
    viewer.src = proxyUrl;
}
