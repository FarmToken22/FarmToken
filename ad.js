// ad.js

// এই ফাংশনটি একটি নির্দিষ্ট ad container-এ বিজ্ঞাপন যোগ করে
function displayAd(containerId, adOptions) {
    const adContainer = document.getElementById(containerId);
    if (adContainer) {
        const script1 = document.createElement('script');
        script1.type = 'text/javascript';
        
        let optionsString = '';
        for (const key in adOptions) {
            optionsString += `'${key}' : '${adOptions[key]}', `;
        }
        
        script1.innerHTML = `atOptions = { ${optionsString} 'params' : {} };`;

        const script2 = document.createElement('script');
        script2.type = 'text/javascript';
        script2.src = `//www.highperformanceformat.com/${adOptions.key}/invoke.js`;
        
        adContainer.innerHTML = ''; // আগের বিজ্ঞাপন মুছে ফেলুন
        adContainer.appendChild(script1);
        adContainer.appendChild(script2);
    }
}

// যখন পেজ লোড হবে, তখন বিজ্ঞাপনগুলো দেখানো হবে
document.addEventListener('DOMContentLoaded', () => {
    // ব্যানার অ্যাড ১ (Header)
    displayAd('bannerAdContainer1', {
        'key': '63718988f07bc6d276f3c6a441757cae',
        'format': 'iframe',
        'height': 90,
        'width': 728
    });

    // ব্যানার অ্যাড ২ (Footer)
    displayAd('bannerAdContainer2', {
        'key': '53c6462d2fd5ad5b91686ca9561f79a2',
        'format': 'iframe',
        'height': 90,
        'width': 728
    });
});