import re
from typing import Tuple, Optional

class TextProcessor:
    """Класс для обработки и очистки текста переписок"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Базовая очистка текста"""
        
        # Убираем лишние пробелы
        text = re.sub(r'\s+', ' ', text)
        
        # Убираем служебные метки телеграма и WhatsApp
        text = re.sub(r'\[.*?\]', '', text)  # [Фото], [Видео] и т.д.
        text = re.sub(r'<.*?>', '', text)    # HTML теги
        
        # Убираем timestamp форматы
        text = re.sub(r'\d{2}:\d{2}(:\d{2})?', '', text)  # 12:34 или 12:34:56
        text = re.sub(r'\d{2}\.\d{2}\.\d{4}', '', text)   # 01.01.2024
        
        return text.strip()
    
    @staticmethod
    def extract_messages(text: str) -> Tuple[int, int]:
        """
        Подсчитать количество сообщений от каждого участника
        
        Returns:
            (messages_from_a, messages_from_b)
        """
        
        # Пытаемся определить разделители сообщений
        lines = text.split('\n')
        
        # Простая эвристика: считаем строки как сообщения
        total_lines = len([l for l in lines if l.strip()])
        
        # Грубая оценка 50/50 если не можем определить точно
        return (total_lines // 2, total_lines // 2)
    
    @staticmethod
    def validate_text(text: str) -> Tuple[bool, Optional[str]]:
        """
        Валидация текста
        
        Returns:
            (is_valid, error_message)
        """
        
        if not text or not text.strip():
            return False, "Текст пустой"
        
        if len(text) < 50:
            return False, "Текст слишком короткий (минимум 50 символов)"
        
        if len(text) > 50000:
            return False, "Текст слишком длинный (максимум 50000 символов)"
        
        # Проверяем что есть хотя бы несколько слов
        words = text.split()
        if len(words) < 10:
            return False, "Недостаточно слов для анализа"
        
        return True, None
    
    @staticmethod
    def detect_language(text: str) -> str:
        """Определить язык текста (простая эвристика)"""
        
        # Кириллица
        cyrillic_chars = len(re.findall(r'[а-яА-ЯёЁ]', text))
        # Латиница
        latin_chars = len(re.findall(r'[a-zA-Z]', text))
        
        if cyrillic_chars > latin_chars:
            return "ru"
        else:
            return "en"
    
    @staticmethod
    def anonymize_names(text: str) -> str:
        """Анонимизировать имена в тексте"""
        
        # Заменяем @username на Person A/B
        text = re.sub(r'@\w+', '[Person]', text)
        
        # Заменяем распространенные имена (опционально)
        # Это можно расширить
        
        return text

text_processor = TextProcessor()
