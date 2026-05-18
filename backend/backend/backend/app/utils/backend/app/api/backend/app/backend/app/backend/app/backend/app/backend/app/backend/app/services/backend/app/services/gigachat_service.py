import httpx
import json
import asyncio
import time
import logging
from typing import Optional, Dict, Any
from ..config import settings
import ssl
import certifi

logger = logging.getLogger(__name__)

class GigaChatService:
    """Сервис для работы с GigaChat API"""
    
    def __init__(self):
        self.api_key = settings.GIGACHAT_API_KEY
        self.auth_url = settings.GIGACHAT_AUTH_URL
        self.api_url = settings.GIGACHAT_API_URL
        self.scope = settings.GIGACHAT_SCOPE
        self.access_token: Optional[str] = None
        self.token_expires_at: float = 0
        
        # SSL context для работы с сертификатами Сбера
        self.ssl_context = ssl.create_default_context(cafile=certifi.where())
        
    async def get_access_token(self) -> str:
        """Получить access token через OAuth"""
        
        # Если токен еще валиден, возвращаем его
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
        
        logger.info("Получение нового access token от GigaChat")
        
        try:
            async with httpx.AsyncClient(verify=self.ssl_context) as client:
                response = await client.post(
                    self.auth_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "RqUID": f"{int(time.time() * 1000)}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data={
                        "scope": self.scope
                    },
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                self.access_token = data["access_token"]
                # Токен живет expires_in секунд, берем с запасом -60 сек
                self.token_expires_at = time.time() + data.get("expires_in", 1800) - 60
                
                logger.info("Access token успешно получен")
                return self.access_token
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Ошибка HTTP при получении токена: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Не удалось получить access token: {e.response.text}")
        except Exception as e:
            logger.error(f"Ошибка при получении access token: {str(e)}")
            raise

    async def analyze_conversation(
        self,
        text: str,
        analysis_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Анализ переписки через GigaChat
        
        Args:
            text: Текст переписки
            analysis_type: Тип анализа (free, single, extended, pro)
        
        Returns:
            Dict с результатами анализа
        """
        
        token = await self.get_access_token()
        
        # Формируем промпт в зависимости от типа анализа
        system_prompt = self._get_system_prompt(analysis_type)
        user_prompt = self._format_user_prompt(text)
        
        logger.info(f"Отправка запроса в GigaChat. Тип: {analysis_type}, длина текста: {len(text)}")
        
        try:
            async with httpx.AsyncClient(verify=self.ssl_context, timeout=120.0) as client:
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "GigaChat",  # или "GigaChat-Pro" для более глубокого анализа
                        "messages": [
                            {
                                "role": "system",
                                "content": system_prompt
                            },
                            {
                                "role": "user",
                                "content": user_prompt
                            }
                        ],
                        "temperature": 0.7,
                        "max_tokens": 2000,
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                # Извлекаем ответ
                content = data["choices"][0]["message"]["content"]
                
                # Парсим JSON из ответа
                result = self._parse_ai_response(content)
                
                # Добавляем метаданные
                result["_metadata"] = {
                    "model": data.get("model"),
                    "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                    "created_at": data.get("created")
                }
                
                logger.info(f"Анализ успешно выполнен. Токсичность: {result.get('toxicity_index')}")
                
                return result
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP ошибка при анализе: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Ошибка API GigaChat: {e.response.text}")
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга JSON ответа: {str(e)}")
            raise Exception("Не удалось распарсить ответ от AI")
        except Exception as e:
            logger.error(f"Неожиданная ошибка при анализе: {str(e)}")
            raise

    def _get_system_prompt(self, analysis_type: str) -> str:
        """Получить системный промпт в зависимости от типа анализа"""
        
        base_prompt = """Ты — профессиональный психолог-аналитик межличностных отношений с 15-летним опытом.

Твоя специализация:
- Анализ токсичных отношений
- Выявление манипуляций и газлайтинга
- Определение стилей привязанности
- Психологическое профилирование

Задача: проанализировать переписку между двумя людьми (условно А и Б).

ВАЖНО: Ответ должен быть СТРОГО в формате JSON, без дополнительного текста."""

        if analysis_type == "free":
            return base_prompt + """

Верни JSON со следующими полями:
{
  "toxicity_index": 0-100,
  "manipulation_detected": true/false,
  "gaslighting_score": 0.0-1.0,
  "emotional_dependency_a": 0.0-1.0,
  "emotional_dependency_b": 0.0-1.0,
  "dominant_side": "A" или "B" или "Equal",
  "attachment_style_a": "anxious/avoidant/secure/fearful",
  "attachment_style_b": "anxious/avoidant/secure/fearful",
  "red_flags": ["флаг1", "флаг2", ...],
  "personality_analysis": {
    "archetype": "краткое описание",
    "strengths": ["сила1", "сила2"],
    "weaknesses": ["слабость1", "слабость2"],
    "communication_style": "описание стиля"
  },
  "recommendations": ["совет1", "совет2", "совет3"]
}"""

        elif analysis_type in ["extended", "pro"]:
            return base_prompt + """

Верни РАСШИРЕННЫЙ JSON:
{
  "toxicity_index": 0-100,
  "manipulation_detected": true/false,
  "gaslighting_score": 0.0-1.0,
  "emotional_dependency_a": 0.0-1.0,
  "emotional_dependency_b": 0.0-1.0,
  "dominant_side": "A/B/Equal",
  "attachment_style_a": "anxious/avoidant/secure/fearful",
  "attachment_style_b": "anxious/avoidant/secure/fearful",
  "red_flags": ["детальные флаги с примерами"],
  "personality_analysis": {
    "archetype": "глубокое описание архетипа",
    "strengths": ["детальные сильные стороны"],
    "weaknesses": ["детальные слабости"],
    "communication_style": "подробный анализ стиля",
    "hidden_needs": ["скрытые потребности"],
    "vulnerabilities": ["психологические уязвимости"],
    "attachment_trauma": "анализ травм привязанности"
  },
  "recommendations": ["детальные рекомендации с шагами"],
  "return_probability": 0.0-1.0,
  "dependency_winner": "A/B/Equal - кто более зависим",
  "breakup_initiator_prediction": "A/B - кто скорее всего уйдет первым",
  "compatibility_score": 0-100,
  "longterm_prognosis": "прогноз отношений"
}"""

        return base_prompt

    def _format_user_prompt(self, text: str) -> str:
        """Форматировать текст для отправки в AI"""
        return f"""Проанализируй следующую переписку:

---
{text}
---

Верни результат строго в JSON формате, без дополнительных комментариев."""

    def _parse_ai_response(self, content: str) -> Dict[str, Any]:
        """Парсинг ответа от AI"""
        
        # Убираем markdown разметку если есть
        content = content.strip()
        
        # Убираем ```json и ``` если есть
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        
        if content.endswith("```"):
            content = content[:-3]
        
        content = content.strip()
        
        try:
            result = json.loads(content)
            
            # Валидация обязательных полей
            required_fields = [
                "toxicity_index",
                "manipulation_detected",
                "gaslighting_score",
                "red_flags",
                "recommendations"
            ]
            
            for field in required_fields:
                if field not in result:
                    logger.warning(f"Отсутствует обязательное поле: {field}")
                    # Устанавливаем значения по умолчанию
                    if field == "red_flags" or field == "recommendations":
                        result[field] = []
                    elif field == "manipulation_detected":
                        result[field] = False
                    else:
                        result[field] = 0
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Не удалось распарсить JSON. Ответ: {content[:500]}")
            
            # Fallback: возвращаем структуру с ошибкой
            return {
                "toxicity_index": 0,
                "manipulation_detected": False,
                "gaslighting_score": 0,
                "emotional_dependency_a": 0,
                "emotional_dependency_b": 0,
                "dominant_side": "Unknown",
                "attachment_style_a": "unknown",
                "attachment_style_b": "unknown",
                "red_flags": ["Ошибка анализа"],
                "personality_analysis": {
                    "archetype": "Не определено",
                    "strengths": [],
                    "weaknesses": [],
                    "communication_style": "Не определено"
                },
                "recommendations": ["Повторите анализ"],
                "_error": str(e),
                "_raw_response": content[:1000]
            }

# Singleton instance
gigachat_service = GigaChatService()
