const urlInput = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

function handleBrowse() {
    let url = urlInput.value.trim();
    if (!url) return;

    // ইউআরএল ফরম্যাট ঠিক করা
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    // লোডার দেখানো
    loader.style.display = 'block';
    viewer.style.opacity = '0.3';
    
    // Vercel api/proxy কল করা
    viewer.src = `/api/proxy?url=${encodeURIComponent(url)}`;
}

// লোড শেষ হলে লোডার লুকানো
viewer.onload = () => {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
};

browseBtn.addEventListener('click', handleBrowse);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleBrowse();
});
