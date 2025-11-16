// menu.js - Menu Section Module
import { switchSection } from './app.js';

const menuItems = [
    {
        name: 'FZ AI',
        href: 'https://farmtoken22.github.io/FZ-Ai/index.html',
        icon: 'icon.png',
        description: 'FarmZone AI Support Assistant',
        color: 'from-green-500 to-emerald-500',
        isImage: true
    },
    {
        name: 'Extra',
        href: 'Extra.html',
        icon: '🎁',
        description: 'Extra features and rewards',
        color: 'from-purple-500 to-pink-500',
        isImage: false
    },
    {
        name: 'Connect',
        href: 'Connect.html',
        icon: '🔗',
        description: 'Connect your wallet',
        color: 'from-blue-500 to-cyan-500',
        isImage: false
    },
    {
        name: 'Settings',
        href: 'Settings.html',
        icon: '⚙️',
        description: 'App settings and preferences',
        color: 'from-gray-500 to-slate-500',
        isImage: false
    },
    {
        name: 'Roadmap',
        href: 'Roadmap.html',
        icon: '🗺️',
        description: 'Project roadmap and milestones',
        color: 'from-green-500 to-emerald-500',
        isImage: false
    },
    {
        name: 'Usage Policy',
        href: 'Usage Policy.html',
        icon: '📋',
        description: 'Terms and usage policy',
        color: 'from-orange-500 to-amber-500',
        isImage: false
    },
    {
        name: 'Privacy Policy',
        href: 'Privacy Policy.html',
        icon: '🔒',
        description: 'Privacy and data protection',
        color: 'from-red-500 to-rose-500',
        isImage: false
    }
];

// ========================================
// RENDER MENU SECTION
// ========================================
export function renderMenuSection() {
    const container = document.getElementById('menuSection');
    if (!container) return;
    
    container.innerHTML = `
        <div class="p-4 max-w-lg mx-auto w-full">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg p-6 mb-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">Menu</h2>
                        <p class="text-sm opacity-90 mt-1">Quick access to all features</p>
                    </div>
                    <button id="closeMenuSection" class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Menu Grid -->
            <div class="grid grid-cols-2 gap-3">
                ${menuItems.map((item, index) => `
                    <a href="${item.href}" 
                       class="menu-card bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:scale-105"
                       data-index="${index}"
                       ${item.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                        <div class="bg-gradient-to-br ${item.color} p-4 text-center">
                            ${item.isImage 
                                ? `<div class="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden bg-white p-2">
                                       <img src="${item.icon}" alt="${item.name}" class="w-full h-full object-contain">
                                   </div>` 
                                : `<div class="text-4xl mb-2">${item.icon}</div>`
                            }
                        </div>
                        <div class="p-3">
                            <h3 class="font-bold text-gray-800 text-center mb-1">${item.name}</h3>
                            <p class="text-xs text-gray-500 text-center">${item.description}</p>
                        </div>
                    </a>
                `).join('')}
            </div>
            
            <!-- Back to Home Button -->
            <div class="mt-6">
                <button id="backToHome" class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                    <div class="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </div>
                </button>
            </div>
        </div>
    `;
    
    console.log('Menu section rendered');
}

// ========================================
// INITIALIZE MENU SECTION
// ========================================
export function initMenuSection() {
    renderMenuSection();
    
    // Close button handler
    const closeBtn = document.getElementById('closeMenuSection');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            switchSection('home');
        });
    }
    
    // Back to home button
    const backBtn = document.getElementById('backToHome');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            switchSection('home');
        });
    }
    
    // Menu card click handlers
    const menuCards = document.querySelectorAll('.menu-card');
    menuCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const href = card.getAttribute('href');
            
            // If it's an external link, let it open normally
            if (href.startsWith('http')) {
                console.log('Opening external link:', href);
                return; // Let the default behavior happen
            }
            
            // For internal links, prevent default and show notification
            e.preventDefault();
            console.log('Navigating to:', href);
            
            // Show a loading notification
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = 'Opening ' + href + '...';
                notification.style.background = '#28a745';
                notification.className = 'notification show';
                setTimeout(() => notification.className = 'notification', 2000);
            }
            
            // Navigate after a short delay
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
    
    console.log('Menu section initialized');
}

// ========================================
// LISTEN FOR MENU OPEN EVENT
// ========================================
document.addEventListener('openMenuSection', () => {
    console.log('Menu section open event received');
    if (typeof switchSection === 'function') {
        switchSection('menu');
    }
});

// Export functions
export default {
    renderMenuSection,
    initMenuSection
};