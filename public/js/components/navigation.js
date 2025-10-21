// Navigation Components

class NavigationManager {
    constructor() {
        this.navToggle = null;
        this.navMenu = null;
        this.dropdowns = [];
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.navToggle = document.querySelector('.nav__toggle');
        this.navMenu = document.querySelector('.nav__menu');
        
        if (this.navToggle && this.navMenu) {
            this.initMobileMenu();
        }
        
        this.initDropdowns();
        this.initKeyboardNavigation();
        this.initAccessibility();
        this.handleResize();
    }

    initMobileMenu() {
        // Toggle menu on button click
        this.navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !this.navMenu.contains(e.target) && 
                !this.navToggle.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
                this.navToggle.focus();
            }
        });

        // Close menu when clicking on a link
        this.navMenu.addEventListener('click', (e) => {
            if (e.target.matches('a[href]')) {
                this.closeMenu();
            }
        });
    }

    initDropdowns() {
        this.dropdowns = document.querySelectorAll('.nav__dropdown');
        
        this.dropdowns.forEach(dropdown => {
            this.initDropdown(dropdown);
        });
    }

    initDropdown(dropdown) {
        const toggle = dropdown.querySelector('.nav__link');
        const content = dropdown.querySelector('.nav__dropdown-content');
        
        if (!toggle || !content) return;

        // Set ARIA attributes
        toggle.setAttribute('aria-haspopup', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        content.setAttribute('role', 'menu');

        // Add click handlers for mobile
        if (Utils.isMobile()) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown(dropdown);
            });
        } else {
            // Desktop hover behavior
            dropdown.addEventListener('mouseenter', () => {
                this.openDropdown(dropdown);
            });

            dropdown.addEventListener('mouseleave', () => {
                this.closeDropdown(dropdown);
            });
        }
    }

    initKeyboardNavigation() {
        // Handle keyboard navigation for menu items
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                
                if (target.classList.contains('nav__link') && 
                    target.getAttribute('aria-haspopup') === 'true') {
                    e.preventDefault();
                    this.toggleDropdown(target.closest('.nav__dropdown'));
                }
            }
        });

        // Arrow key navigation for dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const dropdown = e.target.closest('.nav__dropdown');
                if (dropdown && dropdown.classList.contains('is-open')) {
                    e.preventDefault();
                    this.handleArrowNavigation(e, dropdown);
                }
            }
        });
    }

    initAccessibility() {
        // Skip navigation link
        const skipLink = document.querySelector('.nav__skip');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Focus management for mobile menu
        if (this.navMenu) {
            this.navMenu.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.handleMenuTabNavigation(e);
                }
            });
        }
    }

    handleResize() {
        // Handle window resize
        const resizeHandler = Utils.debounce(() => {
            if (Utils.isMobile()) {
                this.closeAllDropdowns();
            }
        }, 250);

        window.addEventListener('resize', resizeHandler);
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.navMenu.classList.add('is-open');
        this.navToggle.setAttribute('aria-expanded', 'true');
        this.isMenuOpen = true;
        
        // Focus first menu item
        const firstLink = this.navMenu.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.navMenu.classList.remove('is-open');
        this.navToggle.setAttribute('aria-expanded', 'false');
        this.isMenuOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Close all dropdowns
        this.closeAllDropdowns();
    }

    toggleDropdown(dropdown) {
        if (dropdown.classList.contains('is-open')) {
            this.closeDropdown(dropdown);
        } else {
            this.openDropdown(dropdown);
        }
    }

    openDropdown(dropdown) {
        // Close other dropdowns first
        this.closeAllDropdowns();
        
        dropdown.classList.add('is-open');
        const toggle = dropdown.querySelector('.nav__link');
        toggle.setAttribute('aria-expanded', 'true');
        
        // Focus first item in dropdown
        const firstItem = dropdown.querySelector('.nav__dropdown-content a');
        if (firstItem) {
            firstItem.focus();
        }
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('is-open');
        const toggle = dropdown.querySelector('.nav__link');
        toggle.setAttribute('aria-expanded', 'false');
    }

    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }

    handleArrowNavigation(e, dropdown) {
        const items = dropdown.querySelectorAll('.nav__dropdown-content a');
        const currentIndex = Array.from(items).indexOf(document.activeElement);
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        
        items[nextIndex].focus();
    }

    handleMenuTabNavigation(e) {
        const focusableElements = this.navMenu.querySelectorAll('a, button');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    // Public methods
    openMenu() {
        this.openMenu();
    }

    closeMenu() {
        this.closeMenu();
    }

    isMenuOpen() {
        return this.isMenuOpen;
    }

    // Cleanup method
    destroy() {
        if (this.navToggle) {
            this.navToggle.removeEventListener('click', this.toggleMenu);
        }
        
        this.dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.nav__link');
            if (toggle) {
                toggle.removeEventListener('click', this.toggleDropdown);
            }
        });
    }
}

// Initialize navigation manager
const navigationManager = new NavigationManager();

// Export for use in other scripts
window.NavigationManager = navigationManager;
