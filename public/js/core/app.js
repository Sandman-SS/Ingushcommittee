// Main Application Entry Point
class App {
    constructor() {
        this.components = new Map();
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        // Initialize common components
        this.initAnimations();
        this.initNavigation();
        this.initForms();
        
        // Initialize page-specific components
        this.initPageComponents();
        
        // Initialize accessibility features
        this.initAccessibility();
        
        console.log('App initialized successfully');
    }

    initAnimations() {
        // Fade-in animations on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        // Observe all elements with fade-in classes
        document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-up, .fade-in-down, .fade-in-scale').forEach(el => {
            observer.observe(el);
        });
    }

    initNavigation() {
        const navToggle = document.querySelector('.nav__toggle');
        const navMenu = document.querySelector('.nav__menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('is-open');
                navToggle.setAttribute('aria-expanded', navMenu.classList.contains('is-open'));
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('is-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                    navMenu.classList.remove('is-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                    navToggle.focus();
                }
            });
        }

        // Handle dropdown menus
        this.initDropdowns();
    }

    initDropdowns() {
        const dropdowns = document.querySelectorAll('.nav__dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.nav__link');
            const content = dropdown.querySelector('.nav__dropdown-content');
            
            if (toggle && content) {
                // Desktop hover behavior
                if (window.innerWidth > 768) {
                    dropdown.addEventListener('mouseenter', () => {
                        content.style.display = 'block';
                        content.style.visibility = 'visible';
                        content.style.opacity = '1';
                        content.style.transform = 'translateY(0) scale(1)';
                    });

                    dropdown.addEventListener('mouseleave', () => {
                        content.style.display = 'none';
                        content.style.visibility = 'hidden';
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-15px) scale(0.9)';
                    });
                } else {
                    // Mobile click behavior
                    toggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        dropdown.classList.toggle('is-open');
                        toggle.setAttribute('aria-expanded', dropdown.classList.contains('is-open'));
                    });
                }
            }
        });
    }

    initForms() {
        // Form validation
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });

        // Real-time validation
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        const fieldGroup = field.closest('.form-group');
        const feedback = fieldGroup ? fieldGroup.querySelector('.form-feedback') : null;
        
        let isValid = true;
        let message = '';
        
        // Required field validation
        if (isRequired && !value) {
            isValid = false;
            message = 'Это поле обязательно для заполнения';
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Введите корректный email адрес';
            }
        }
        
        // Update field state
        field.classList.toggle('is-invalid', !isValid);
        field.classList.toggle('is-valid', isValid && value);
        
        // Update feedback message
        if (feedback) {
            feedback.classList.toggle('is-invalid', !isValid);
            feedback.classList.toggle('is-valid', isValid && value);
            feedback.textContent = message;
        }
        
        return isValid;
    }

    initPageComponents() {
        // Initialize page-specific components based on current page
        const body = document.body;
        const pageClass = body.className;
        
        if (pageClass.includes('map-page') || window.location.pathname === '/map') {
            this.initMapPage();
        }
        
        if (pageClass.includes('contact-page') || window.location.pathname === '/contact') {
            this.initContactPage();
        }
    }

    initMapPage() {
        // Map-specific initialization will be handled by interactive-map.js
        console.log('Map page components initialized');
    }

    initContactPage() {
        // Contact form specific initialization
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactFormSubmit(contactForm);
            });
        }
    }

    async handleContactFormSubmit(form) {
        const formData = new FormData(form);
        const statusDiv = document.getElementById('form-status');
        
        try {
            // Show loading state
            statusDiv.className = 'form-status form-status--info';
            statusDiv.textContent = 'Отправка сообщения...';
            statusDiv.style.display = 'block';
            
            // Simulate form submission (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            statusDiv.className = 'form-status form-status--success';
            statusDiv.textContent = 'Сообщение успешно отправлено!';
            
            // Reset form
            form.reset();
            
        } catch (error) {
            // Show error message
            statusDiv.className = 'form-status form-status--error';
            statusDiv.textContent = 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.';
        }
    }

    initAccessibility() {
        // Skip navigation functionality
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

        // Keyboard navigation for dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('nav__link') && target.getAttribute('aria-haspopup') === 'true') {
                    e.preventDefault();
                    target.click();
                }
            }
        });
    }

    // Utility method to register components
    registerComponent(name, component) {
        this.components.set(name, component);
    }

    // Utility method to get components
    getComponent(name) {
        return this.components.get(name);
    }
}

// Initialize the app
const app = new App();

// Export for use in other scripts
window.App = app;
