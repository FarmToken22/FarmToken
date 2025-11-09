// ad.js - Advertisement Management System
// ==========================================
// ADMIN PANEL ADVERTISEMENT INTEGRATION
// ==========================================

/**
 * Load all advertisements from localStorage (Admin Panel configured ads)
 */
export function loadAdvertisements() {
    console.log('🎯 Loading advertisements from Admin Panel...');
    
    // Load Top Banner Ad (Ad Slot 1)
    const topAd = localStorage.getItem('farmzone_ad_1');
    if (topAd) {
        displayAd('bannerAdContainer1', 'mobileAdContent1', topAd);
        console.log('✅ Top banner ad loaded');
    } else {
        console.log('ℹ️ No top banner ad configured');
    }
    
    // Load Bottom Banner Ad (Ad Slot 2)
    const bottomAd = localStorage.getItem('farmzone_ad_2');
    if (bottomAd) {
        displayAd('bannerAdContainer2', 'mobileAdContent2', bottomAd);
        console.log('✅ Bottom banner ad loaded');
    } else {
        console.log('ℹ️ No bottom banner ad configured');
    }
    
    console.log('🎯 Advertisement loading complete');
}

/**
 * Display ad in a specific container
 * @param {string} containerId - Container element ID
 * @param {string} contentId - Content element ID where ad will be inserted
 * @param {string} adCode - HTML/JavaScript ad code
 */
function displayAd(containerId, contentId, adCode) {
    const container = document.getElementById(containerId);
    const content = document.getElementById(contentId);
    
    if (!container || !content) {
        console.error(`❌ Ad container not found: ${containerId}`);
        return;
    }
    
    try {
        // Show the container
        container.classList.remove('hidden');
        
        // Insert ad code
        content.innerHTML = adCode;
        
        // Execute any scripts in the ad code
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
        
        // Add loaded animation class
        setTimeout(() => {
            container.classList.add('loaded');
        }, 150);
        
        console.log(`✅ Ad displayed successfully in ${containerId}`);
    } catch (error) {
        console.error(`❌ Error displaying ad in ${containerId}:`, error);
    }
}

/**
 * Load modal/popup ad when user claims rewards
 */
export function loadModalAd() {
    const modalAd = localStorage.getItem('farmzone_ad_modal');
    const claimAdDiv = document.getElementById('claimAd');
    
    if (!claimAdDiv) {
        console.error('❌ Modal ad container not found');
        return;
    }
    
    if (modalAd) {
        try {
            // Clear previous content
            claimAdDiv.innerHTML = '';
            
            // Create a wrapper div
            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalAd;
            claimAdDiv.appendChild(wrapper);
            
            // Execute scripts in modal ad
            const scripts = wrapper.getElementsByTagName('script');
            Array.from(scripts).forEach(script => {
                const newScript = document.createElement('script');
                
                // Copy all attributes
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                
                if (script.src) {
                    newScript.src = script.src;
                    newScript.async = true;
                } else {
                    newScript.textContent = script.textContent;
                }
                
                document.body.appendChild(newScript);
                
                // Clean up
                setTimeout(() => {
                    if (newScript.parentNode) {
                        newScript.parentNode.removeChild(newScript);
                    }
                }, 100);
            });
            
            console.log('✅ Modal ad loaded from Admin Panel');
            return true; // Ad loaded successfully
        } catch (error) {
            console.error('❌ Error loading modal ad:', error);
            claimAdDiv.innerHTML = '<p class="text-gray-600 text-sm text-center">Thank you for using FarmZone! 🎉</p>';
            return false;
        }
    } else {
        // No admin ad configured, show fallback message
        claimAdDiv.innerHTML = '<p class="text-gray-600 text-sm text-center">Thank you for using FarmZone! 🎉</p>';
        console.log('ℹ️ No modal ad configured, showing fallback message');
        return false;
    }
}

/**
 * Show ad modal with smart fallback system
 * First tries Admin Panel ad, then falls back to default ad
 * @param {string} fallbackAdKey - Optional fallback ad key for PropellerAds
 */
export function showAdModal(fallbackAdKey = '78ade24182729fceea8e45203dad915b') {
    const modal = document.getElementById('adModal');
    if (!modal) {
        console.warn("❌ Ad modal not found");
        return;
    }

    // First, try to load ad from Admin Panel
    const adminModalAd = localStorage.getItem('farmzone_ad_modal');
    
    if (adminModalAd) {
        // Use admin-configured ad
        console.log('📢 Loading ad from Admin Panel');
        loadModalAd();
    } else {
        // Fallback to default ad
        console.log('📢 Loading default fallback ad');
        loadFallbackAd(fallbackAdKey);
    }

    // Show modal
    modal.style.display = 'flex';
    
    // Setup close handlers
    setupModalCloseHandlers(modal);
}

/**
 * Load fallback ad (PropellerAds or similar)
 * @param {string} adKey - Ad network key
 */
function loadFallbackAd(adKey) {
    const adContainer = document.getElementById('claimAd');
    
    if (!adContainer) {
        console.warn("❌ Ad container not found");
        return;
    }

    // Clear previous ad
    adContainer.innerHTML = '';
    
    // Create ad script container
    const container = document.createElement('div');
    container.innerHTML = `
        <script type="text/javascript">
            atOptions = {'key':'${adKey}','format':'iframe','height':250,'width':300,'params':{}};
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/${adKey}/invoke.js"></script>
    `;
    adContainer.appendChild(container);
    
    console.log('✅ Fallback ad loaded');
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
 * Initialize Admin Panel access shortcut
 * Triple tap on logo to open admin panel
 */
export function initAdminAccess() {
    let logoTapCount = 0;
    let logoTapTimer;

    const logo = document.querySelector('header img');
    if (!logo) {
        console.warn('⚠️ Logo not found for admin access shortcut');
        return;
    }
    
    logo.addEventListener('click', () => {
        logoTapCount++;
        
        clearTimeout(logoTapTimer);
        
        if (logoTapCount === 3) {
            const confirmed = confirm(
                '🔐 Access Admin Panel?\n\n' +
                'This will open the advertisement management panel where you can:\n' +
                '• Configure top banner ads\n' +
                '• Configure bottom banner ads\n' +
                '• Configure modal popup ads'
            );
            
            if (confirmed) {
                window.location.href = 'admin.html';
            }
            logoTapCount = 0;
        }
        
        logoTapTimer = setTimeout(() => {
            logoTapCount = 0;
        }, 1000); // Reset after 1 second
    });
    
    console.log('✅ Admin access shortcut initialized (Triple tap logo)');
}

/**
 * Check if any ads are configured
 * @returns {Object} Status of all ad slots
 */
export function getAdStatus() {
    return {
        topBanner: !!localStorage.getItem('farmzone_ad_1'),
        bottomBanner: !!localStorage.getItem('farmzone_ad_2'),
        modalAd: !!localStorage.getItem('farmzone_ad_modal')
    };
}

/**
 * Clear all configured ads (for debugging)
 */
export function clearAllAds() {
    localStorage.removeItem('farmzone_ad_1');
    localStorage.removeItem('farmzone_ad_2');
    localStorage.removeItem('farmzone_ad_modal');
    console.log('🗑️ All ads cleared from localStorage');
}

// Export for debugging in console
if (typeof window !== 'undefined') {
    window.adDebug = {
        getAdStatus,
        clearAllAds,
        loadAdvertisements,
        loadModalAd
    };
}