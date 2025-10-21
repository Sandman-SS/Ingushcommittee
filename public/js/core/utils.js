// Utility Functions

class Utils {
    // Debounce function
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Get element by selector with error handling
    static $(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    }

    // Get all elements by selector
    static $$(selector) {
        return document.querySelectorAll(selector);
    }

    // Add event listener with automatic cleanup
    static addEvent(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
            return () => element.removeEventListener(event, handler, options);
        }
        return () => {};
    }

    // Smooth scroll to element
    static scrollTo(element, offset = 0) {
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Format date
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('ru-RU', { ...defaultOptions, ...options }).format(date);
    }

    // Format number
    static formatNumber(number, options = {}) {
        return new Intl.NumberFormat('ru-RU', options).format(number);
    }

    // Generate unique ID
    static generateId(prefix = 'id') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check if device is mobile
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Check if device is tablet
    static isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    // Check if device is desktop
    static isDesktop() {
        return window.innerWidth > 1024;
    }

    // Get device type
    static getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }

    // Local storage helpers
    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    }

    // Session storage helpers
    static setSessionStorage(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to sessionStorage:', error);
        }
    }

    static getSessionStorage(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from sessionStorage:', error);
            return defaultValue;
        }
    }

    // Cookie helpers
    static setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    static getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    static deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    // URL helpers
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static updateUrlParam(key, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.history.replaceState({}, '', url);
    }

    // Animation helpers
    static animateElement(element, animation, duration = 300) {
        return new Promise((resolve) => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    // Loading state helpers
    static showLoading(element, text = 'Загрузка...') {
        if (element) {
            element.dataset.originalText = element.textContent;
            element.textContent = text;
            element.disabled = true;
            element.classList.add('btn-loading');
        }
    }

    static hideLoading(element) {
        if (element) {
            element.textContent = element.dataset.originalText || '';
            element.disabled = false;
            element.classList.remove('btn-loading');
        }
    }

    // Error handling
    static handleError(error, context = '') {
        console.error(`Error${context ? ` in ${context}` : ''}:`, error);
        
        // Show user-friendly error message
        this.showNotification('Произошла ошибка. Попробуйте еще раз.', 'error');
    }

    // Notification system
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            info: '#2196f3',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Скопировано в буфер обмена', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Скопировано в буфер обмена', 'success');
        }
    }

    // Performance helpers
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Async performance measurement
    static async measureAsyncPerformance(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
}

// Export for use in other scripts
window.Utils = Utils;
