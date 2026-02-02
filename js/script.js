const urlInput = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

// প্রক্সি ফাংশন
function loadSite() {
    let url = urlInput.value.trim();

    if (!url) {
        alert("দয়া করে একটি URL লিখুন!");
        return;
    }

    // যদি ইউজার http বা https না লেখে
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // লোডার অন করা
    loader.style.display = 'block';
    viewer.style.opacity = '0'; // লোড হওয়ার আগে লুকিয়ে রাখা

    // প্রক্সি সার্ভারের ঠিকানা (আপনার Vercel বা লোকাল সার্ভার পাথ)
    // নিশ্চিত করুন আপনার ব্যাকএন্ড 'api/proxy.js' এ আছে
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

    // আইফ্রেমে লোড করা
    viewer.src = proxyUrl;
}

// লোড শেষ হলে
viewer.onload = function() {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
    console.log("Iframe loaded successfully via proxy.");
};

// বাটন ক্লিক ইভেন্ট
browseBtn.addEventListener('click', loadSite);

// এন্টার বাটন চাপলে কাজ করবে
urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadSite();
    }
});
