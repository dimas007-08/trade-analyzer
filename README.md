# 📊 TradeAnalyzer Pro

Профессиональный анализатор торговых сделок для трейдеров с автоматическим импортом из Bybit.

## 🚀 Быстрый деплой на Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Шаг 1: Нажми кнопку выше или перейди на [railway.app](https://railway.app)

### Шаг 2: Создай проект
1. Войди через GitHub
2. Нажми **"New Project"**
3. Выбери **"Deploy from GitHub repo"**

### Шаг 3: Добавь базу данных
1. Нажми **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway автоматически добавит `DATABASE_URL`

### Шаг 4: Добавь Bybit ключи (опционально)
В разделе **Variables** добавь:
- `BYBIT_API_KEY` — твой API ключ
- `BYBIT_API_SECRET` — твой секретный ключ

### Шаг 5: Готово! 🎉
Railway выдаст тебе ссылку на приложение.

---

## ✨ Возможности

- 📈 **Дашборд** — PnL, винрейт, profit factor, просадка
- 📋 **Журнал сделок** — все сделки с фильтрами
- 📊 **Графики сделок** — свечи с отметками входа/выхода
- 🔗 **Bybit API** — автоимпорт сделок с биржи
- 💹 **Рынок** — котировки криптовалют в реальном времени
- 🧮 **Калькулятор позиции** — расчёт по риску
- 👁️ **Watchlist** — список наблюдения

---

## 🔐 Настройка Bybit API

1. Перейди на https://www.bybit.com/app/user/api-management
2. Создай API ключ с правами **только на чтение**
3. Добавь ключи в Railway Variables

---

## 🛠️ Локальная разработка

```bash
# Установка
npm install

# Настрой .env
DATABASE_URL=postgresql://user:pass@localhost:5432/trade_analyzer

# Создай таблицы
npx drizzle-kit push

# Запуск
npm run dev
```

---

Made with ❤️ for traders
