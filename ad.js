/**
 * FarmZone Ad Management System
 * Handles loading of mobile banner and rewarded ads
 */

// Ad Configuration
const AD_CONFIG = {
  mobileBanner: {
    key: '78ade24182729fceea8e45203dad915b',
    format: 'iframe',
    height: 50,
    width: 320,
    invokeUrl: '//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js'
  },
  rewarded: {
    key: '53c6462d2fd5ad5b91686ca9561f79a2',
    format: 'iframe',
    height: 90,
    width: 728,
    invokeUrl: '//www.highperformanceformat.com/53c6462d2fd5ad5b91686ca9561f79a2/invoke.js'
  }
};

// Track loaded ads to prevent duplicates
const loadedAds = new Set();

/**
 * Show ad container with loaded class
 * @param {HTMLElement} container - The container element
 */
function showAdContainer(container) {
  if (container) {
    container.classList.add('loaded');
    
    // Show parent container if it's hidden
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.add('loaded');
    }
    
    console.log('✅ Ad container shown with loaded class');
  }
}

/**
 * Load Mobile Banner Ad (320x50)
 * @param {string} containerId - ID of the container element
 */
export function loadMobileBannerAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`⚠️ Container ${containerId} not found for mobile banner ad`);
    return;
  }

  // Prevent duplicate loading
  const adKey = `mobile-${containerId}`;
  if (loadedAds.has(adKey)) {
    console.log('ℹ️ Mobile banner ad already loaded in this container');
    return;
  }

  try {
    // Clear container
    container.innerHTML = '';

    // Set global atOptions for this ad
    window.atOptions = {
      key: AD_CONFIG.mobileBanner.key,
      format: AD_CONFIG.mobileBanner.format,
      height: AD_CONFIG.mobileBanner.height,
      width: AD_CONFIG.mobileBanner.width,
      params: {}
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = AD_CONFIG.mobileBanner.invokeUrl;
    script.async = true;
    
    script.onload = () => {
      // Show container when ad loads successfully
      setTimeout(() => {
        showAdContainer(container);
        loadedAds.add(adKey);
        console.log(`✅ Mobile banner ad loaded successfully in ${containerId}`);
      }, 500);
    };
    
    script.onerror = () => {
      console.error(`❌ Failed to load mobile banner ad in ${containerId}`);
      // Don't show container if ad fails to load
    };

    // Append to container
    container.appendChild(script);

  } catch (error) {
    console.error('❌ Error loading mobile banner ad:', error);
  }
}

/**
 * Load Rewarded Ad (728x90 - shown during reward claiming)
 * @param {string} containerId - ID of the container element
 */
export function loadRewardedAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`⚠️ Container ${containerId} not found for rewarded ad`);
    return;
  }

  try {
    // Clear container (rewarded ads can be loaded multiple times)
    container.innerHTML = '';
    container.classList.remove('loaded');

    // Set global atOptions for this ad
    window.atOptions = {
      key: AD_CONFIG.rewarded.key,
      format: AD_CONFIG.rewarded.format,
      height: AD_CONFIG.rewarded.height,
      width: AD_CONFIG.rewarded.width,
      params: {}
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = AD_CONFIG.rewarded.invokeUrl;
    script.async = true;
    
    script.onload = () => {
      // Show container when ad loads successfully
      setTimeout(() => {
        showAdContainer(container);
        console.log('✅ Rewarded ad loaded successfully');
      }, 500);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load rewarded ad');
      container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 14px;">Loading ad...</div>';
      // Show container even on error for modal
      container.classList.add('loaded');
    };

    // Append to container
    container.appendChild(script);

  } catch (error) {
    console.error('❌ Error loading rewarded ad:', error);
    container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 14px;">Ad loading...</div>';
    // Show container even on error for modal
    container.classList.add('loaded');
  }
}

/**
 * Preload ads for better performance
 * Call this function early in your app lifecycle
 */
export function preloadAds() {
  console.log('🔄 Preloading ad scripts...');
  
  // Preload scripts by creating link elements
  const scripts = [
    AD_CONFIG.mobileBanner.invokeUrl,
    AD_CONFIG.rewarded.invokeUrl
  ];

  scripts.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  });
  
  console.log('✅ Ad scripts preloaded');
}

/**
 * Clear ad from container
 * @param {string} containerId - ID of the container element
 */
export function clearAd(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
    container.classList.remove('loaded');
    
    // Hide parent container if needed
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.remove('loaded');
    }
    
    // Remove from loaded ads set
    loadedAds.forEach(key => {
      if (key.includes(containerId)) {
        loadedAds.delete(key);
      }
    });
    
    console.log(`🗑️ Ad cleared from ${containerId}`);
  }
}

/**
 * Refresh ad in container
 * @param {string} containerId - ID of the container element
 * @param {string} adType - Type of ad: 'mobile' or 'rewarded'
 */
export function refreshAd(containerId, adType) {
  console.log(`🔄 Refreshing ${adType} ad in ${containerId}`);
  clearAd(containerId);
  
  setTimeout(() => {
    switch(adType) {
      case 'mobile':
        loadMobileBannerAd(containerId);
        break;
      case 'rewarded':
        loadRewardedAd(containerId);
        break;
      default:
        console.warn(`⚠️ Unknown ad type: ${adType}`);
    }
  }, 100);
}

/**
 * Check if an ad is loaded in a container
 * @param {string} containerId - ID of the container element
 * @returns {boolean} - True if ad is loaded
 */
export function isAdLoaded(containerId) {
  const adKey = `mobile-${containerId}`;
  return loadedAds.has(adKey);
}

/**
 * Get ad statistics
 * @returns {object} - Statistics about loaded ads
 */
export function getAdStats() {
  return {
    totalLoaded: loadedAds.size,
    loadedAds: Array.from(loadedAds),
    config: {
      mobileBanner: AD_CONFIG.mobileBanner.key,
      rewarded: AD_CONFIG.rewarded.key
    }
  };
}

// Auto-initialize on module load
console.log('🎯 FarmZone Ad System initialized (Mobile + Rewarded only)');
console.log('📱 Mobile Banner Ad Key:', AD_CONFIG.mobileBanner.key);
console.log('🎁 Rewarded Ad Key:', AD_CONFIG.rewarded.key);

// Export all functions
export default {
  loadMobileBannerAd,
  loadRewardedAd,
  preloadAds,
  clearAd,
  refreshAd,
  isAdLoaded,
  getAdStats,
  AD_CONFIG
};