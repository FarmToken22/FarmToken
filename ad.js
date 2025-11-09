// ad.js - Advertisement Management System
// ==========================================
// DIRECT AD INTEGRATION (No Admin Panel)
// ==========================================

/**
 * Advertisement Configuration
 * Define all ad codes directly here
 */
const AD_CONFIG = {
    // Ad Slot 1 - Top Banner (Desktop: 728x90)
    slot1: {
        key: '63718988f07bc6d276f3c6a441757cae',
        format: 'iframe',
        height: 90,
        width: 728,
        name: 'Top Banner'
    },
    
    // Ad Slot 2 - Bottom Banner (Desktop: 728x90)
    slot2: {
        key: '53c6462d2fd5ad5b91686ca9561f79a2',
        format: 'iframe',
        height: 90,
        width: 728,
        name: 'Bottom Banner'
    },
    
    // Ad Slot 3 - Modal/Popup (Mobile: 320x50)
    slot3: {
        key: '78ade24182729fceea8e45203dad915b',
        format: 'iframe',
        height: 50,
        width: 320,
        name: 'Modal Ad'
    }
};

/**
 * Ad rotation settings
 */
const ROTATION_SETTINGS = {
    interval: 15000, // 15 seconds (15-20 সেকেন্ড range এ 15 নিলাম)
    ads: ['slot1', 'slot2', 'slot3'],
    currentIndex: 0
};

/**
 * App loading state tracker
 */
let appLoaded = false;
let rotationTimer = null;
let currentlyDisplayedAd = null;

/**
 * Mark app as loaded
 * Call this function when your app/game finishes loading
 */
export function setAppLoaded() {
    appLoaded = true;
    console.log('✅ App loaded - Starting ad rotation');
    startAdRotation();
}

/**
 * Check if app is loaded
 */
export function isAppLoaded() {
    return appLoaded;
}

/**
 * Start ad rotation system
 * Shows one ad at a time, rotates every 15-20 seconds
 */
function startAdRotation() {
    if (!appLoaded) {
        console.log('⏳ App not loaded yet - Ad rotation will start after app loads');
        return;
    }
    
    console.log('🔄 Starting ad rotation system...');
    
    // Show first ad immediately
    showNextAd();
    
    // Setup rotation timer
    if (rotationTimer) {
        clearInterval(rotationTimer);
    }
    
    rotationTimer = setInterval(() => {
        showNextAd();
    }, ROTATION_SETTINGS.interval);
}

/**
 * Show next ad in rotation
 */
function showNextAd() {
    // Hide current ad if any
    if (currentlyDisplayedAd) {
        hideAd(currentlyDisplayedAd);
    }
    
    // Get next ad from rotation
    const adSlot = ROTATION_SETTINGS.ads[ROTATION_SETTINGS.currentIndex];
    const adConfig = AD_CONFIG[adSlot];
    
    // Display the ad
    displayRotatingAd(adSlot, adConfig);
    
    // Update index for next rotation
    ROTATION_SETTINGS.currentIndex = (ROTATION_SETTINGS.currentIndex + 1) % ROTATION_SETTINGS.ads.length;
    
    console.log(`🎯 Now showing: ${adConfig.name} (Next rotation in ${ROTATION_SETTINGS.interval / 1000}s)`);
}

/**
 * Display rotating ad in main ad container
 * @param {string} adSlot - Ad slot identifier
 * @param {Object} adConfig - Ad configuration object
 */
function displayRotatingAd(adSlot, adConfig) {
    const container = document.getElementById('mainAdContainer');
    const content = document.getElementById('mainAdContent');
    
    if (!container || !content) {
        console.error(`❌ Main ad container not found`);
        return;
    }
    
    try {
        // Mark current ad
        currentlyDisplayedAd = adSlot;
        
        // Show the container
        container.classList.remove('hidden');
        
        // Clear previous content
        content.innerHTML = '';
        
        // Create ad code
        const adCode = createAdCode(adConfig);
        
        // Insert ad code
        content.innerHTML = adCode;
        
        // Execute scripts
        executeAdScripts(content);
        
        // Add loaded animation class
        setTimeout(() => {
            container.classList.add('loaded');
        }, 150);
        
        console.log(`✅ ${adConfig.name} displayed successfully`);
    } catch (error) {
        console.error(`❌ Error displaying ${adConfig.name}:`, error);
    }
}

/**
 * Hide specific ad
 * @param {string} adSlot - Ad slot to hide
 */
function hideAd(adSlot) {
    const container = document.getElementById('mainAdContainer');
    const content = document.getElementById('mainAdContent');
    
    if (container && content) {
        container.classList.add('hidden');
        // Clear content after animation
        setTimeout(() => {
            content.innerHTML = '';
        }, 300);
    }
}

/**
 * Stop ad rotation
 */
export function stopAdRotation() {
    if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
        console.log('⏹️ Ad rotation stopped');
    }
    
    if (currentlyDisplayedAd) {
        hideAd(currentlyDisplayedAd);
        currentlyDisplayedAd = null;
    }
}

/**
 * Create ad code HTML from configuration
 * @param {Object} config - Ad configuration
 * @returns {string} HTML ad code
 */
function createAdCode(config) {
    return `
        <script type="text/javascript">
            atOptions = {
                'key': '${config.key}',
                'format': '${config.format}',
                'height': ${config.height},
                'width': ${config.width},
                'params': {}
            };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/${config.key}/invoke.js"></script>
    `;
}

/**
 * Execute scripts in ad content
 * @param {HTMLElement} content - Content element containing scripts
 */
function executeAdScripts(content) {
    const scripts = content.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
        const newScript = document.createElement('script');
        
        // Copy all attributes from original script
        Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        if (script.src) {
            // External script
            newScript.src = script.src;
            newScript.async = true;
        } else {
            // Inline script
            newScript.textContent = script.textContent;
        }
        
        // Append to body to execute
        document.body.appendChild(newScript);
        
        // Clean up old script after execution
        setTimeout(() => {
            if (newScript.parentNode) {
                newScript.parentNode.removeChild(newScript);
            }
        }, 100);
    });
}

/**
 * Load modal/popup ad when user claims rewards
 * Uses slot3 configuration
 */
export function loadModalAd() {
    const claimAdDiv = document.getElementById('claimAd');
    
    if (!claimAdDiv) {
        console.error('❌ Modal ad container not found');
        return false;
    }
    
    try {
        // Clear previous content
        claimAdDiv.innerHTML = '';
        
        // Create ad code using slot3
        const adCode = createAdCode(AD_CONFIG.slot3);
        
        // Insert ad code
        claimAdDiv.innerHTML = adCode;
        
        // Execute scripts
        executeAdScripts(claimAdDiv);
        
        console.log('✅ Modal ad loaded');
        return true;
    } catch (error) {
        console.error('❌ Error loading modal ad:', error);
        claimAdDiv.innerHTML = '<p class="text-gray-600 text-sm text-center">Thank you for using FarmZone! 🎉</p>';
        return false;
    }
}

/**
 * Show ad modal
 */
export function showAdModal() {
    const modal = document.getElementById('adModal');
    if (!modal) {
        console.warn("❌ Ad modal not found");
        return;
    }

    console.log('📢 Loading modal ad');
    loadModalAd();

    // Show modal
    modal.style.display = 'flex';
    
    // Setup close handlers
    setupModalCloseHandlers(modal);
}

/**
 * Setup modal close handlers
 * @param {HTMLElement} modal - Modal element
 */
function setupModalCloseHandlers(modal) {
    const close = () => {
        modal.style.display = 'none';
    };
    
    // Close button handler
    const closeBtn = document.getElementById('adCloseBtn');
    if (closeBtn) {
        // Remove old listeners to prevent duplicates
        closeBtn.removeEventListener('click', close);
        closeBtn.addEventListener('click', close);
    }
    
    // Auto-close after 5 seconds
    setTimeout(close, 5000);
}

/**
 * Initialize advertisement system
 * Call this when DOM is ready
 */
export function initAdSystem() {
    console.log('🎬 Advertisement system initialized');
    console.log('⏳ Waiting for app to load...');
    console.log(`⚙️ Rotation interval: ${ROTATION_SETTINGS.interval / 1000} seconds`);
    console.log('📢 Ads will rotate: Slot 1 → Slot 2 → Slot 3 → Repeat');
    
    // Note: Call setAppLoaded() when your app finishes loading
}

/**
 * Initialize Admin Panel access shortcut (DEPRECATED - Kept for compatibility)
 * This function is no longer needed as admin panel has been removed
 */
export function initAdminAccess() {
    console.log('⚠️ Admin panel has been removed. Ad configuration is now managed directly in ad.js');
}

/**
 * Change rotation interval (in seconds)
 * @param {number} seconds - Rotation interval in seconds
 */
export function setRotationInterval(seconds) {
    ROTATION_SETTINGS.interval = seconds * 1000;
    console.log(`⚙️ Rotation interval updated to ${seconds} seconds`);
    
    // Restart rotation if already running
    if (appLoaded && rotationTimer) {
        stopAdRotation();
        startAdRotation();
    }
}

/**
 * Get current ad configuration (for debugging)
 */
export function getAdConfig() {
    return {
        adSlots: AD_CONFIG,
        rotation: {
            ...ROTATION_SETTINGS,
            intervalSeconds: ROTATION_SETTINGS.interval / 1000,
            currentAd: currentlyDisplayedAd
        },
        appLoaded: appLoaded,
        isRotating: rotationTimer !== null
    };
}

// Export for debugging in console
if (typeof window !== 'undefined') {
    window.adDebug = {
        getAdConfig,
        setAppLoaded,
        isAppLoaded,
        startAdRotation,
        stopAdRotation,
        showNextAd,
        setRotationInterval,
        loadModalAd,
        showAdModal
    };
    
    console.log('💡 Debug commands available: window.adDebug');
    console.log('   - getAdConfig() - View current configuration');
    console.log('   - setRotationInterval(seconds) - Change rotation speed');
    console.log('   - stopAdRotation() - Stop rotation');
    console.log('   - startAdRotation() - Resume rotation');
}