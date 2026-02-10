document.addEventListener('DOMContentLoaded', function() {
    // Функция для создания кнопок шеринга
    function createShareButtons() {
        const shareContainers = document.querySelectorAll('.social-share');
        
        shareContainers.forEach(container => {
            const url = encodeURIComponent(container.dataset.url || window.location.href);
            const title = encodeURIComponent(container.dataset.title || document.title);
            const text = encodeURIComponent(container.dataset.text || '');
            
            const buttons = `
                <div class="share-buttons">
                    <span class="share-label">Поделиться:</span>
                    <a href="https://t.me/share/url?url=${url}&text=${title}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="share-btn share-telegram"
                       aria-label="Поделиться в Telegram">
                        <i class="fab fa-telegram"></i>
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${title}%20${url}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="share-btn share-whatsapp"
                       aria-label="Поделиться в WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <a href="https://vk.com/share.php?url=${url}&title=${title}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="share-btn share-vk"
                       aria-label="Поделиться ВКонтакте">
                        <i class="fab fa-vk"></i>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="share-btn share-facebook"
                       aria-label="Поделиться в Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://twitter.com/intent/tweet?url=${url}&text=${title}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="share-btn share-twitter"
                       aria-label="Поделиться в Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                </div>
            `;
            
            container.innerHTML = buttons;
        });
    }
    
    // Функция копирования в буфер обмена (Clipboard API)
    window.copyToClipboard = async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Ссылка скопирована!';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        } catch (err) {
            console.error('Не удалось скопировать: ', err);
        }
    };
    
    // Инициализация
    createShareButtons();
});