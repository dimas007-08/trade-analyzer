# 🚀 TradeAnalyzer Pro — Инструкция по установке

## Требования

- **Node.js** 18+ (https://nodejs.org/)
- **PostgreSQL** 14+ (https://www.postgresql.org/)
- **Git** (опционально)

---

## Шаг 1: Установка Node.js

### Windows / Mac
1. Перейди на https://nodejs.org/
2. Скачай **LTS** версию
3. Установи, следуя инструкциям
4. Проверь установку:
   ```bash
   node --version
   npm --version
   ```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Шаг 2: Установка PostgreSQL

### Windows
1. Скачай с https://www.postgresql.org/download/windows/
2. Установи (запомни пароль для пользователя `postgres`!)
3. Создай базу данных:
   - Открой **pgAdmin** или **SQL Shell (psql)**
   - Выполни: `CREATE DATABASE trade_analyzer;`

### Mac
```bash
# Через Homebrew
brew install postgresql@16
brew services start postgresql@16

# Создай базу
createdb trade_analyzer
```

### Linux
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Создай базу
sudo -u postgres createdb trade_analyzer
```

---

## Шаг 3: Настройка проекта

### 1. Скачай проект
Скопируй все файлы в папку, например `C:\Projects\trade-analyzer` или `~/projects/trade-analyzer`

### 2. Создай файл `.env`
В корне проекта создай файл `.env` с содержимым:

```env
# База данных (замени пароль на свой!)
DATABASE_URL=postgresql://postgres:ТвойПароль@localhost:5432/trade_analyzer

# Bybit API (опционально, для импорта сделок)
BYBIT_API_KEY=твой_api_key
BYBIT_API_SECRET=твой_api_secret

# Для тестнета Bybit (опционально)
# BYBIT_TESTNET=true
```

### 3. Установи зависимости
Открой терминал в папке проекта:

```bash
npm install
```

### 4. Создай таблицы в базе данных
```bash
npx drizzle-kit push
```

---

## Шаг 4: Запуск

### Режим разработки (с hot-reload)
```bash
npm run dev
```

### Production сборка
```bash
npm run build
npm run start
```

---

## 🌐 Готово!

Открой в браузере: **http://localhost:3000**

---

## Возможные проблемы

### "DATABASE_URL is required"
→ Проверь файл `.env` и путь к базе данных

### "Connection refused" к PostgreSQL
→ Убедись, что PostgreSQL запущен:
- Windows: проверь в Службах
- Mac: `brew services start postgresql@16`
- Linux: `sudo systemctl start postgresql`

### "Port 3000 is already in use"
→ Измени порт: `npm run dev -- -p 3001`

### Ошибки при `npm install`
→ Удали node_modules и попробуй снова:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Bybit API ключи

1. Перейди на https://www.bybit.com/app/user/api-management
2. Создай новый API ключ
3. **ВАЖНО:** Выбери только права "Read" (чтение)
4. Добавь ключи в `.env` или введи в настройках приложения

---

## Обновление

Для обновления базы данных после изменений:
```bash
npx drizzle-kit push
```

---

Удачи! 🚀📊
