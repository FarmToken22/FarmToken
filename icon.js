/**
 * @fileoverview Sidebar Navigation Icons Configuration
 * @author WebGamer Studio
 * @version 1.0.0
 * @description Centralized icon definitions for sidebar navigation with SVG icons
 * @license MIT
 */

/**
 * @typedef {Object} SidebarIcon
 * @property {string} name - Display name of the navigation item
 * @property {string} href - Target URL or page reference
 * @property {string} svg - SVG markup for the icon
 * @property {string} [description] - Optional description for accessibility
 */

/**
 * Sidebar navigation icons collection
 * @type {SidebarIcon[]}
 * @constant
 */
export const sidebarIcons = [
  {
    name: 'Withdraw',
    href: 'Withdraw.html',
    description: 'Manage withdrawal operations',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5l-3-3m0 0l-3 3m3-3v8" />
    </svg>`,
  },
  {
    name: 'Settings',
    href: 'Settings.html',
    description: 'Configure application settings',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>`,
  },
  {
    name: 'Connect',
    href: 'Connect.html',
    description: 'Connect with other users',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>`,
  },
  {
    name: 'Roadmap',
    href: 'Roadmap.html',
    description: 'View project roadmap',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7" />
    </svg>`,
  },
  {
    name: 'Usage Policy',
    href: 'usage-policy.html',
    description: 'Read usage policy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
  },
  {
    name: 'Privacy Policy',
    href: 'privacy-policy.html',
    description: 'Read privacy policy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>`,
  },
  {
    name: 'Notifications',
    href: 'notification.html',
    description: 'View notifications',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>`,
  },
];

/**
 * Get sidebar icon by name
 * @param {string} name - Name of the icon to retrieve
 * @returns {SidebarIcon|undefined} The matching icon object or undefined
 */
export const getSidebarIconByName = (name) => {
  return sidebarIcons.find((icon) => icon.name === name);
};

/**
 * Get sidebar icon by href
 * @param {string} href - Href of the icon to retrieve
 * @returns {SidebarIcon|undefined} The matching icon object or undefined
 */
export const getSidebarIconByHref = (href) => {
  return sidebarIcons.find((icon) => icon.href === href);
};

/**
 * Get all icon names
 * @returns {string[]} Array of all icon names
 */
export const getAllIconNames = () => {
  return sidebarIcons.map((icon) => icon.name);
};

/**
 * Validate icon object structure
 * @param {SidebarIcon} icon - Icon object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidIcon = (icon) => {
  return (
    icon &&
    typeof icon.name === 'string' &&
    typeof icon.href === 'string' &&
    typeof icon.svg === 'string' &&
    icon.name.length > 0 &&
    icon.href.length > 0 &&
    icon.svg.length > 0
  );
};

export default sidebarIcons;