// Animation Components

class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.initScrollAnimations();
        this.initHoverAnimations();
        this.initLoadingAnimations();
    }

    initScrollAnimations() {
        // Intersection Observer for scroll-triggered animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                }
            });
        }, observerOptions);

        // Observe all elements with animation classes
        const animationElements = document.querySelectorAll(`
            .fade-in, .fade-in-left, .fade-in-right, 
            .fade-in-up, .fade-in-down, .fade-in-scale,
            .animate-on-scroll
        `);

        animationElements.forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    initHoverAnimations() {
        // Hover animations for interactive elements
        const hoverElements = document.querySelectorAll(`
            .hover-lift, .hover-scale, .hover-rotate, .hover-glow
        `);

        hoverElements.forEach(el => {
            this.addHoverListeners(el);
        });
    }

    initLoadingAnimations() {
        // Loading state animations
        const loadingElements = document.querySelectorAll('.btn-loading, .loading-spinner, .loading-dots');
        
        loadingElements.forEach(el => {
            this.initLoadingAnimation(el);
        });
    }

    triggerAnimation(element) {
        // Add active class to trigger CSS animation
        element.classList.add('active');
        
        // Handle specific animation types
        if (element.classList.contains('animate-on-scroll')) {
            element.classList.add('in-view');
        }

        // Trigger custom events
        element.dispatchEvent(new CustomEvent('animation:start', {
            detail: { element }
        }));

        // Clean up after animation completes
        const duration = this.getAnimationDuration(element);
        setTimeout(() => {
            element.dispatchEvent(new CustomEvent('animation:complete', {
                detail: { element }
            }));
        }, duration);
    }

    addHoverListeners(element) {
        const hoverClasses = {
            'hover-lift': 'hover-lift',
            'hover-scale': 'hover-scale',
            'hover-rotate': 'hover-rotate',
            'hover-glow': 'hover-glow'
        };

        Object.entries(hoverClasses).forEach(([className, baseClass]) => {
            if (element.classList.contains(className)) {
                element.addEventListener('mouseenter', () => {
                    this.triggerHoverAnimation(element, baseClass);
                });

                element.addEventListener('mouseleave', () => {
                    this.resetHoverAnimation(element, baseClass);
                });
            }
        });
    }

    triggerHoverAnimation(element, animationType) {
        // Skip on touch devices to avoid conflicts
        if (Utils.isMobile()) return;

        element.classList.add(`${animationType}--active`);
        
        element.dispatchEvent(new CustomEvent('hover:start', {
            detail: { element, animationType }
        }));
    }

    resetHoverAnimation(element, animationType) {
        element.classList.remove(`${animationType}--active`);
        
        element.dispatchEvent(new CustomEvent('hover:end', {
            detail: { element, animationType }
        }));
    }

    initLoadingAnimation(element) {
        if (element.classList.contains('btn-loading')) {
            this.initButtonLoading(element);
        } else if (element.classList.contains('loading-spinner')) {
            this.initSpinnerLoading(element);
        } else if (element.classList.contains('loading-dots')) {
            this.initDotsLoading(element);
        }
    }

    initButtonLoading(button) {
        const originalContent = button.innerHTML;
        const loadingContent = `
            <span class="loading-spinner"></span>
            <span class="loading-text">Загрузка...</span>
        `;

        button.dataset.originalContent = originalContent;
        button.innerHTML = loadingContent;
        button.disabled = true;
    }

    stopButtonLoading(button) {
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            button.disabled = false;
            delete button.dataset.originalContent;
        }
    }

    initSpinnerLoading(element) {
        // Spinner animation is handled by CSS
        element.style.display = 'inline-block';
    }

    initDotsLoading(element) {
        // Dots animation is handled by CSS
        element.style.display = 'inline-block';
    }

    getAnimationDuration(element) {
        // Get animation duration from CSS or default to 600ms
        const computedStyle = window.getComputedStyle(element);
        const duration = computedStyle.animationDuration || computedStyle.transitionDuration;
        
        if (duration && duration !== '0s') {
            return parseFloat(duration) * 1000;
        }
        
        return 600; // Default duration
    }

    // Public methods for programmatic control
    animateElement(element, animationClass, duration = 300) {
        return new Promise((resolve) => {
            element.classList.add(animationClass);
            
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    fadeOut(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    slideDown(element, duration = 300) {
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        
        return new Promise((resolve) => {
            element.style.transition = `height ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.height = targetHeight + 'px';
            });
            
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    slideUp(element, duration = 300) {
        const startHeight = element.offsetHeight;
        
        return new Promise((resolve) => {
            element.style.height = startHeight + 'px';
            element.style.overflow = 'hidden';
            element.style.transition = `height ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.height = '0';
            });
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    // Cleanup method
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
    }
}

// Initialize animation manager
const animationManager = new AnimationManager();

// Export for use in other scripts
window.AnimationManager = animationManager;
