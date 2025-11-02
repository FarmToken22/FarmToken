/**
 * @fileoverview Sidebar Navigation Icons Configuration (Filtered)
 * @author WebGamer Studio
 * @version 1.0.1
 * @description Sidebar will only show Settings, Roadmap, and Connect icons.
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
 * Sidebar navigation icons (filtered)
 * @type {SidebarIcon[]}
 * @constant
 */
export const sidebarIcons = [
  {
    name: 'Settings',
    href: 'Settings.html',
    description: 'Configure application settings',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 
        3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 
        3.31.826 2.37 2.37a1.724 1.724 0 001.065 
        2.572c1.756.426 1.756 2.924 0 3.35a1.724 
        1.724 0 00-1.066 2.573c.94 1.543-.826 
        3.31-2.37 2.37a1.724 1.724 0 00-2.572 
        1.065c-.426 1.756-2.924 1.756-3.35 
        0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31
        -.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c
        -1.756-.426-1.756-2.924 0-3.35a1.724 
        1.724 0 001.066-2.573c-.94-1.543.826
        -3.31 2.37-2.37.996.608 2.296.096 
        2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>`,
  },
  {
    name: 'Connect',
    href: 'Connect.html',
    description: 'Connect with other users',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12s
        -.114-.938-.316-1.342m0 2.684a3 3 0 
        110-2.684m0 2.684l6.632 3.316m-6.632
        -6l6.632-3.316m0 0a3 3 0 105.367
        -2.684 3 3 0 00-5.367 2.684zm0 
        9.368a3 3 0 105.367 2.684 3 3 
        0 00-5.367-2.684z" />
    </svg>`,
  },
  {
    name: 'Roadmap',
    href: 'Roadmap.html',
    description: 'View project roadmap',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M9 20l-5.447-2.724A1 1 0 
        013 16.382V5.618a1 1 0 011.447
        -.894L9 7m0 13l6-3m-6 3V7m6 
        10l5.447 2.724A1 1 0 0021 
        16.382V5.618a1 1 0 00-1.447
        -.894L15 7" />
    </svg>`,
  },
];

/** Utility functions **/
export const getSidebarIconByName = (name) =>
  sidebarIcons.find((icon) => icon.name === name);

export const getSidebarIconByHref = (href) =>
  sidebarIcons.find((icon) => icon.href === href);

export const getAllIconNames = () =>
  sidebarIcons.map((icon) => icon.name);

export const isValidIcon = (icon) =>
  icon &&
  typeof icon.name === 'string' &&
  typeof icon.href === 'string' &&
  typeof icon.svg === 'string' &&
  icon.name.length > 0 &&
  icon.href.length > 0 &&
  icon.svg.length > 0;

export default sidebarIcons;