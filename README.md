# ОптиРемонт — лендинг + калькулятор + цены + чат DeepSeek

## Запуск
1) Установите Node.js (желательно 18+)
2) В папке проекта:
```bash
npm install
```

## DeepSeek (ключ хранится на сервере)
Создайте файл `.env` рядом с `server.js`:
```bash
DEEPSEEK_API_KEY=ваш_ключ_здесь
# опционально:
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
```

Запуск:
```bash
npm start
```
Открыть: http://localhost:3000

## API
- GET /api/prices
- POST /api/prices/refresh (демо)
- POST /api/chat (прокси к DeepSeek; ключ не уходит в браузер)

Важно: «подтягивание цен из магазинов» в проде лучше делать через официальные источники (API/прайсы/таблицы),
а не парсинг страниц.
