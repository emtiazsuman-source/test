const urlInput = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

function handleBrowse() {
    let url = urlInput.value.trim();
    if (!url) return;

    // URL না হলে গুগলে সার্চ করা
    if (!isValidUrl(url)) {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    loader.style.display = 'block';
    viewer.style.opacity = '0.3';
    
    // Vercel এর API কল করা
    viewer.src = `/api/proxy?url=${encodeURIComponent(url)}`;
}

// URL টেস্ট করার ফাংশন
function isValidUrl(string) {
    try {
        const url = new URL(string.startsWith('http') ? string : 'https://' + string);
        return url.hostname.includes('.') && !url.hostname.includes(' ');
    } catch (_) {
        return false;
    }
}

viewer.onload = () => {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
};

browseBtn.addEventListener('click', handleBrowse);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleBrowse();
});
