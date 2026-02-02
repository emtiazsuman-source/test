const urlInput = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

function handleBrowse() {
    let url = urlInput.value.trim();
    if (!url) return;

    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    loader.style.display = 'block';
    viewer.style.opacity = '0.3';
    
    // Vercel এর API কল করা
    viewer.src = `/api/proxy?url=${encodeURIComponent(url)}`;
}

viewer.onload = () => {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
};

browseBtn.addEventListener('click', handleBrowse);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleBrowse();
});
