// Файл: /public/js/form-validation.js

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;

    // Правила валидации (упрощенные)
    const validators = {
        name: {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[а-яА-ЯёЁa-zA-Z\s\-]+$/,
            message: {
                required: 'Пожалуйста, введите ваше имя',
                minLength: 'Имя должно содержать минимум 2 символа',
                maxLength: 'Имя не должно превышать 50 символов',
                pattern: 'Имя может содержать только буквы, пробелы и дефисы'
            }
        },
        message: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            message: {
                required: 'Пожалуйста, введите сообщение',
                minLength: 'Сообщение должно содержать минимум 10 символов',
                maxLength: 'Сообщение не должно превышать 1000 символов'
            }
        }
    };

    // Функция валидации поля
    function validateField(fieldName, value) {
        const rules = validators[fieldName];
        if (!rules) return { valid: true };

        // Проверка обязательного поля
        if (rules.required && !value.trim()) {
            return { valid: false, message: rules.message.required };
        }

        // Проверка минимальной длины
        if (rules.minLength && value.trim().length < rules.minLength) {
            return { valid: false, message: rules.message.minLength };
        }

        // Проверка максимальной длины
        if (rules.maxLength && value.trim().length > rules.maxLength) {
            return { valid: false, message: rules.message.maxLength };
        }

        // Проверка паттерна
        if (rules.pattern && value.trim() && !rules.pattern.test(value)) {
            return { valid: false, message: rules.message.pattern };
        }

        return { valid: true };
    }

    // Функция отображения ошибки
    function showError(fieldName, message) {
        const field = contactForm.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field && errorElement) {
            field.classList.add('error');
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Функция скрытия ошибки
    function hideError(fieldName) {
        const field = contactForm.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field && errorElement) {
            field.classList.remove('error');
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Валидация при вводе
    Object.keys(validators).forEach(fieldName => {
        const field = contactForm.querySelector(`[name="${fieldName}"]`);
        if (field) {
            // Валидация при потере фокуса
            field.addEventListener('blur', function() {
                const result = validateField(fieldName, this.value);
                if (!result.valid) {
                    showError(fieldName, result.message);
                } else {
                    hideError(fieldName);
                }
            });

            // Скрытие ошибки при вводе
            field.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    hideError(fieldName);
                }
            });
        }
    });

    // Обработка отправки формы
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Валидация всех полей
        let isValid = true;
        const formData = new FormData(contactForm);
        
        for (const [fieldName, value] of formData.entries()) {
            const result = validateField(fieldName, value);
            if (!result.valid) {
                showError(fieldName, result.message);
                isValid = false;
            } else {
                hideError(fieldName);
            }
        }

        if (!isValid) {
            // Прокрутка к первой ошибке
            const firstError = contactForm.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        // Показываем индикатор загрузки
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const formStatus = document.getElementById('form-status');
        const originalButtonText = submitButton.innerHTML;
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        formStatus.className = 'form-status';

        try {
            // Отправка формы через AJAX
            const response = await fetch('/submit-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: new URLSearchParams(formData)
            });

            const result = await response.json();

            if (result.success) {
                // Успешная отправка
                formStatus.textContent = result.message;
                formStatus.className = 'form-status success';
                contactForm.reset();
                
                // Через 3 секунды скрываем сообщение
                setTimeout(() => {
                    formStatus.className = 'form-status';
                }, 3000);
            } else {
                // Ошибка валидации или отправки
                formStatus.textContent = result.message;
                formStatus.className = 'form-status error';
            }
        } catch (error) {
            // Ошибка сети
            formStatus.textContent = 'Ошибка соединения. Пожалуйста, попробуйте позже.';
            formStatus.className = 'form-status error';
            console.error('Ошибка отправки формы:', error);
        } finally {
            // Восстанавливаем кнопку
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

});