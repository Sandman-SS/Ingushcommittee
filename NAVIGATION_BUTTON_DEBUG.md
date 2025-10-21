# 🔍 Отладка кнопки навигации

## Проблема
Кнопка-гамбургер для раскрытия навигационной панели не отображается на мобильных устройствах.

## Исправления применены:

### 1. **Добавлены отладочные стили**
```css
.nav-toggle {
  display: block !important;
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1001;
  background: rgba(255, 0, 0, 0.5) !important; /* Debug: red background */
  border: 2px solid white !important; /* Debug: white border */
  color: var(--color-text-inverse);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  width: 40px;
  height: 40px;
  visibility: visible !important;
  opacity: 1 !important;
}
```

### 2. **Добавлены console.log для отладки**
```javascript
console.log('Navigation script loaded');
console.log('navToggle found:', !!navToggle);
console.log('navMenu found:', !!navMenu);
console.log('dropdowns found:', dropdowns.length);
```

### 3. **Принудительное отображение на мобильных**
```css
@media (max-width: 768px) {
  .nav-toggle {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    background: rgba(255, 0, 0, 0.3) !important; /* Debug: red background */
    border: 2px solid white !important; /* Debug: white border */
  }
}
```

## Как проверить:

### 1. **Обновите страницу** (Ctrl+F5)

### 2. **Откройте Developer Tools** (F12)
- Перейдите на вкладку "Console"
- Должны появиться сообщения:
  - "Navigation script loaded"
  - "navToggle found: true"
  - "navMenu found: true"
  - "dropdowns found: 2"

### 3. **Проверьте мобильную версию**
- Переключитесь в мобильный режим (Ctrl+Shift+M)
- Выберите iPhone 12/13 или другое мобильное устройство
- **Должна быть видна красная кнопка с белой рамкой** в правом верхнем углу навигации

### 4. **Если кнопка видна:**
- Нажмите на неё - должно открыться меню
- Кнопка должна анимироваться (превращаться в крестик)
- Меню должно выпадать вниз

### 5. **Если кнопка НЕ видна:**
- Проверьте консоль на ошибки
- Убедитесь, что файл `/css/main-fixed.css` загружается
- Убедитесь, что файл `/js/navigation-fix.js` загружается

## Возможные причины проблемы:

1. **CSS не загружается** - проверьте Network tab в DevTools
2. **JavaScript не выполняется** - проверьте Console на ошибки
3. **Конфликт стилей** - другие CSS файлы переопределяют стили
4. **Кэш браузера** - попробуйте режим инкогнито

## Следующие шаги:

После того как кнопка станет видна (красная с белой рамкой), мы уберем отладочные стили и сделаем её красивой.

**Обновите страницу и проверьте консоль браузера!**
