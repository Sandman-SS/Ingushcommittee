/**
 * Navigation Component - Simple & Clean JavaScript
 * Handles mobile menu toggle and dropdown functionality
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }

    function initNavigation() {
        const mobileToggle = document.querySelector('.main-nav__mobile-toggle');
        const navMenu = document.querySelector('.main-nav__menu');
        const dropdownItems = document.querySelectorAll('.main-nav__item--dropdown');

        // Mobile menu toggle functionality
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', function() {
                const isOpen = navMenu.classList.contains('is-open');

                if (isOpen) {
                    closeMenu();
                } else {
                    openMenu();
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                    if (navMenu.classList.contains('is-open')) {
                        closeMenu();
                    }
                }
            });

            // Close menu on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                    closeMenu();
                    mobileToggle.focus();
                }
            });
        }

        // Mobile dropdown functionality
        dropdownItems.forEach(function(item) {
            const link = item.querySelector('.main-nav__link');

            if (link) {
                link.addEventListener('click', function(e) {
                    // Only prevent default on mobile
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        toggleDropdown(item);
                    }
                });
            }
        });

        // Close dropdowns when clicking on dropdown links
        const dropdownLinks = document.querySelectorAll('.main-nav__dropdown-link');
        dropdownLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeMenu();
                }
            });
        });

        // Handle window resize - close menu if switching to desktop
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768 && navMenu.classList.contains('is-open')) {
                    closeMenu();
                }
            }, 250);
        });

        // Helper functions
        function openMenu() {
            navMenu.classList.add('is-open');
            mobileToggle.setAttribute('aria-expanded', 'true');
            mobileToggle.setAttribute('aria-label', 'Закрыть меню');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            navMenu.classList.remove('is-open');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.setAttribute('aria-label', 'Открыть меню');
            document.body.style.overflow = '';

            // Close all dropdowns when closing menu
            dropdownItems.forEach(function(item) {
                item.classList.remove('is-open');
            });
        }

        function toggleDropdown(item) {
            const isOpen = item.classList.contains('is-open');

            // Close all other dropdowns
            dropdownItems.forEach(function(otherItem) {
                if (otherItem !== item) {
                    otherItem.classList.remove('is-open');
                }
            });

            // Toggle current dropdown
            if (isOpen) {
                item.classList.remove('is-open');
            } else {
                item.classList.add('is-open');
            }
        }
    }
})();
