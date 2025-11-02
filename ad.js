// ad.js

// ✅ Responsive ad size নির্ধারণ
function getResponsiveAdSize() {
    const width = window.innerWidth;

    if (width <= 480) {
        // মোবাইল
        return { width: 320, height: 100 };
    } else if (width <= 768) {
        // ট্যাবলেট
        return { width: 468, height: 60 };
    } else {
        // ডেস্কটপ
        return { width: 728, height: 90 };
    }
}

// ✅ নির্দিষ্ট container-এ বিজ্ঞাপন প্রদর্শন
function displayAd(containerId, adOptions) {
    const adContainer = document.getElementById(containerId);
    if (adContainer) {
        const size = getResponsiveAdSize();

        const script1 = document.createElement('script');
        script1.type = 'text/javascript';

        let optionsString = '';
        for (const key in adOptions) {
            if (key !== 'width' && key !== 'height') {
                optionsString += `'${key}' : '${adOptions[key]}', `;
            }
        }

        script1.innerHTML = `
            atOptions = { 
                ${optionsString} 
                'width': '${size.width}', 
                'height': '${size.height}', 
                'params': {} 
            };
        `;

        const script2 = document.createElement('script');
        script2.type = 'text/javascript';
        script2.src = `//www.highperformanceformat.com/${adOptions.key}/invoke.js`;

        // পুরোনো Ad মুছে নতুন Ad বসাও
        adContainer.innerHTML = '';
        adContainer.style.textAlign = 'center';
        adContainer.style.margin = '10px auto';
        adContainer.style.overflow = 'hidden';
        adContainer.style.maxWidth = `${size.width}px`;

        adContainer.appendChild(script1);
        adContainer.appendChild(script2);
    }
}

// ✅ যখন পেজ লোড হবে
document.addEventListener('DOMContentLoaded', () => {
    // Header Ad
    displayAd('bannerAdContainer1', {
        'key': '63718988f07bc6d276f3c6a441757cae',
        'format': 'iframe'
    });

    // Footer Ad
    displayAd('bannerAdContainer2', {
        'key': '53c6462d2fd5ad5b91686ca9561f79a2',
        'format': 'iframe'
    });
});

// ✅ Responsive refresh: স্ক্রিন রিসাইজ হলে Ad রিফ্রেশ হবে
window.addEventListener('resize', () => {
    clearTimeout(window.adResizeTimeout);
    window.adResizeTimeout = setTimeout(() => {
        document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 500);
});