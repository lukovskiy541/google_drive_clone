# Google Drive Clone

Клон Google Drive з веб-інтерфейсом та десктопним додатком.

## Статус CI/CD

![CI Tests](https://github.com/lukovskiy541/google_drive_clone/actions/workflows/ci.yml/badge.svg)

## Встановлення

```bash
npm install
```

## Розробка

### Веб-додаток
```bash
npm run dev
```

### Десктопний додаток
```bash
npm run desktop:dev
```

## Тестування

```bash
# Запуск тестів один раз
npm test

# Запуск тестів у режимі спостереження
npm run test:watch
```

## Збірка

```bash
# Збірка веб-додатку
npm run build

# Збірка десктопного додатку
npm run desktop:dist
```

## Технології

- **Frontend**: Next.js 15, React 19
- **Backend**: Node.js
- **Database**: PostgreSQL
- **Desktop**: Electron
- **Testing**: Vitest, Testing Library

