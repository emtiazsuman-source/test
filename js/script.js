const inputField = document.getElementById('urlInput');
const browseBtn = document.getElementById('browseBtn');
const viewer = document.getElementById('viewer');
const loader = document.getElementById('loader');

browseBtn.addEventListener('click', loadWebsite);

inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        loadWebsite();
    }
});

function loadWebsite() {
    let query = inputField.value.trim();
    if (!query) return;

    loader.style.display = 'block';
    viewer.style.opacity = '0.5';

    let finalUrl = "";

    // চেক করা হচ্ছে এটা কি URL নাকি সাধারণ লেখা (Search Term)
    const urlPattern = /^(http|https):\/\/[^ "]+$|.*?\..*?/; 
    
    if (urlPattern.test(query)) {
        // যদি URL হয় (যেমন: example.com)
        if (!query.startsWith('http://') && !query.startsWith('https://')) {
            finalUrl = 'https://' + query;
        } else {
            finalUrl = query;
        }
    } else {
        // যদি সাধারণ লেখা হয়, তবে Google Search-এ পাঠাবে
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    // প্রক্সি সার্ভারের মাধ্যমে লোড করা
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    viewer.src = proxyUrl;
}

viewer.onload = function() {
    loader.style.display = 'none';
    viewer.style.opacity = '1';
};
