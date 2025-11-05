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
 * Hide ad container if no ad content
 * @param {HTMLElement} container - The container element
 */
function hideAdContainer(container) {
  if (container) {
    container.classList.remove('loaded');
    
    // Hide parent container
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.remove('loaded');
      parentContainer.classList.add('hidden');
    }
    
    console.log('ℹ️ Ad container hidden (no ad content)');
  }
}

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
      parentContainer.classList.remove('hidden');
      parentContainer.classList.add('loaded');
    }
    
    console.log('✅ Ad container shown with loaded class');
  }
}

/**
 * Check if ad actually loaded content
 * @param {HTMLElement} container - The container element
 * @returns {boolean} - True if ad has content
 */
function hasAdContent(container) {
  if (!container) return false;
  
  // Check for iframe or script tags (ad loaded)
  const hasIframe = container.querySelector('iframe') !== null;
  const hasContent = container.children.length > 0;
  const hasText = container.textContent.trim().length > 0;
  
  return hasIframe || (hasContent && hasText);
}

/**
 * Monitor ad loading and hide container if no content
 * @param {HTMLElement} container - The container element
 * @param {number} timeout - Timeout in milliseconds
 */
function monitorAdLoading(container, timeout = 5000) {
  setTimeout(() => {
    if (!hasAdContent(container)) {
      console.warn('⚠️ No ad content detected, hiding container');
      hideAdContainer(container);
    } else {
      showAdContainer(container);
    }
  }, timeout);
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
    
    // Initially hide the parent container
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.classList.remove('loaded');
    }

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
      // Check if ad loaded after a delay
      setTimeout(() => {
        if (hasAdContent(container)) {
          showAdContainer(container);
          loadedAds.add(adKey);
          console.log(`✅ Mobile banner ad loaded successfully in ${containerId}`);
        } else {
          hideAdContainer(container);
          console.warn(`⚠️ No ad content in ${containerId}, container hidden`);
        }
      }, 1000);
    };
    
    script.onerror = () => {
      console.error(`❌ Failed to load mobile banner ad in ${containerId}`);
      hideAdContainer(container);
    };

    // Append to container
    container.appendChild(script);
    
    // Safety check: hide container if no ad after timeout
    monitorAdLoading(container, 6000);

  } catch (error) {
    console.error('❌ Error loading mobile banner ad:', error);
    hideAdContainer(container);
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
    
    // Initially hide
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.classList.remove('loaded');
    }

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
      // Check if ad loaded after a delay
      setTimeout(() => {
        if (hasAdContent(container)) {
          showAdContainer(container);
          console.log('✅ Rewarded ad loaded successfully');
        } else {
          hideAdContainer(container);
          console.warn('⚠️ No rewarded ad content, container hidden');
        }
      }, 1000);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load rewarded ad');
      hideAdContainer(container);
    };

    // Append to container
    container.appendChild(script);
    
    // Safety check
    monitorAdLoading(container, 6000);

  } catch (error) {
    console.error('❌ Error loading rewarded ad:', error);
    hideAdContainer(container);
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
    
    // Hide parent container
    const parentContainer = container.closest('.ad-container');
    if (parentContainer) {
      parentContainer.classList.remove('loaded');
      parentContainer.classList.add('hidden');
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
  const container = document.getElementById(containerId);
  if (!container) return false;
  
  const adKey = `mobile-${containerId}`;
  return loadedAds.has(adKey) && hasAdContent(container);
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