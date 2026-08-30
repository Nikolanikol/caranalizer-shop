/**
 * Копирование в буфер обмена — одно на весь сайт.
 *
 * Прямой вызов `navigator.clipboard.writeText(...)` роняет обработчик клика в двух
 * случаях, и оба встречаются у живых посетителей:
 *
 * - **`navigator.clipboard` не существует** вне защищённого контекста. Сайт под HTTPS,
 *   но во встроенных браузерах мессенджеров и на старых Android объект отсутствует —
 *   и вместо копирования выходит `TypeError` в консоли и мёртвая кнопка.
 * - **`writeText` отклоняется**: пользователь запретил доступ, или вкладка не в фокусе.
 *   Без `await` это необработанное отклонение промиса, а кнопка при этом уже
 *   отрапортовала «скопировано» — то есть соврала.
 *
 * Поэтому: пробуем современный путь, при отказе — запасной через `execCommand`,
 * и **возвращаем результат**, чтобы вызывающий не врал об успехе.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Нет разрешения или незащищённый контекст — идём запасным путём.
  }

  return legacyCopy(text);
}

/**
 * Запасной путь: скрытое поле и `execCommand`. Он объявлен устаревшим, но работает
 * там, где нет Clipboard API, и другого способа для тех браузеров нет.
 */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const area = document.createElement('textarea');
  area.value = text;
  // Вне экрана, но не `display:none`: скрытое поле нельзя выделить.
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-9999px';
  area.style.opacity = '0';

  try {
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
