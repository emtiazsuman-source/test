const inputField = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

// বাটনে ক্লিক করলে
browseBtn.addEventListener('click', loadWebsite);

// কীবোর্ডের Enter চাপলে
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        loadWebsite();
    }
});

function loadWebsite() {
    let url = inputField.value.trim();

    if (!url) return;

    // লোডার দেখানো
    loader.style.display = 'block';
    viewer.style.opacity = '0.5'; // লোডিং এর সময় একটু ঝাপসা হবে

    // http যুক্ত করা
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Vercel API কল
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    viewer.src = proxyUrl;
}

// আইফ্রেম লোড শেষ হলে লোডার বন্ধ করা
viewer.onload = function() {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
};
