// Mobile Navigation and Dropdown fixes
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('nav ul');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('show');
            
            // Update button text
            navToggle.setAttribute('aria-label', isExpanded ? 'Открыть меню' : 'Закрыть меню');
            
            // Prevent body scroll when menu is open
            if (!isExpanded) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
    
    // Dropdown functionality
    dropdowns.forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector('a[aria-haspopup="true"]');
        const dropdownContent = dropdown.querySelector('.dropdown-content');
        
        if (dropdownToggle && dropdownContent) {
            // Handle click events for mobile
            dropdownToggle.addEventListener('click', function(e) {
                console.log('Dropdown clicked, window width:', window.innerWidth);
                e.preventDefault(); // Always prevent default for dropdown toggles
                
                // Close other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('open');
                        const otherContent = otherDropdown.querySelector('.dropdown-content');
                        const otherToggle = otherDropdown.querySelector('a[aria-haspopup="true"]');
                        if (otherContent && otherToggle) {
                            otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('open');
                const isExpanded = dropdown.classList.contains('open');
                dropdownToggle.setAttribute('aria-expanded', isExpanded);
                
                // For mobile, also ensure dropdown content is visible
                if (window.innerWidth <= 768) {
                    if (isExpanded) {
                        dropdownContent.style.display = 'block';
                        dropdownContent.style.maxHeight = '500px';
                    } else {
                        dropdownContent.style.display = 'none';
                        dropdownContent.style.maxHeight = '0';
                    }
                }
            });
            
            // Remove hover behavior entirely; click-only across breakpoints
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            // Close mobile menu only if clicking outside nav completely
            if (navToggle && navMenu && !e.target.closest('nav')) {
                navMenu.classList.remove('show');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Открыть меню');
                document.body.style.overflow = '';
            }
            
            // Close dropdowns only if clicking outside dropdown area
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('open');
                    const dropdownToggle = dropdown.querySelector('a[aria-haspopup="true"]');
                    if (dropdownToggle) {
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Reset mobile states on desktop
            if (navMenu) {
                navMenu.classList.remove('show');
            }
            if (navToggle) {
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Открыть меню');
            }
            
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('open');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                const dropdownToggle = dropdown.querySelector('a[aria-haspopup="true"]');
                if (dropdownContent && dropdownToggle) {
                    dropdownContent.style.display = 'none';
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });
    
    // Close menu when clicking on regular nav links (not dropdown toggles)
    const navLinks = document.querySelectorAll('nav a:not([aria-haspopup="true"])');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768 && navMenu) {
                navMenu.classList.remove('show');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Открыть меню');
                document.body.style.overflow = '';
            }
        });
    });
});

