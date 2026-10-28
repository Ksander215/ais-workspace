# AIS — Architecture

## Обзор

AIS — исполняющий движок и рантайм, который читает незнакомую кодовую базу и отвечает на
архитектурные вопросы с доказательствами (file:line) за каждым утверждением.

Репозиторий содержит только AIS-контур. Контур SIP (Security Intelligence Platform) — Next.js
лендинг, Express-бэкенд сканера, манифесты scanner-плагинов и Docker-стек — удалён из `main`,
чтобы он не влиял на рантайм, тесты, discovery и CI.

## Слои

```
┌───────────────────────────────────────────────────────────┐
│                    MVP UI (src/mvp-ui)                    │
│  index.ts · http-adapter · github-resolver ·             │
│  path-security · project-store · insight-service         │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│              Interaction layer (src/core)                 │
│  interaction-layer · cognitive runtime · evidence loop   │
│  session · context · memory · knowledge · workflow        │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│        Discovery (src/core/discovery)                     │
│  discovery-pipeline.service · discovery-types             │
│  файловый обход → workspace-юниты → граф зависимостей     │
└───────────────────────────────────────────────────────────┘
```

## Ключевые модули `src/core`

| Модуль | Назначение |
|---|---|
| `engine`, `runtime` | Жизненный цикл, контейнер сервисов, публичный API |
| `discovery` | Скан кодовой базы: файлы, workspace-юниты, граф зависимостей, tech stack |
| `cognitive` | Intent, контекст, компрессия, планирование ответа, model router |
| `evidence-loop` | Проверка утверждений, санитизация секретов |
| `interaction-layer` | Диалог и вопросы пользователя поверх рантайма |
| `memory`, `context`, `session` | Персистентная память, политики контекста, сессии |
| `knowledge`, `evolution`, `checkpoint` | Версии знаний, эволюция, чекпоинты |
| `workflow`, `pipeline`, `fsm`, `task-resolution` | Оркестрация стадий и переходов |
| `plugins`, `tool`, `capability`, `compliance` | Точки расширения, инструменты, политики |

## MVP UI

- `github-resolver.ts` — клонирование публичного репозитория с лимитами (размер, число файлов,
  таймаут) и поддержкой закреплённого commit (`ref`).
- `path-security.ts` — платформенно-корректная защита путей (POSIX/Windows), блокировка traversal
  и sibling-prefix атак.
- `fallback-analysis.ts` — детерминированный режим без LLM: факты из реального скана с
  честным разделением `scan-fact` / `lexical-match`.
- `project-store.ts` — локальное хранение проектов и сессий.

## Ограничения и правила

- Факт ≠ гипотеза; отсутствие ответа ≠ подтверждение.
- CLI/CI ≠ runtime: проверка CI не заменяет наблюдение в рантайме.
- Все утверждения снабжены источниками `file:line`.

Подробности: [SRC-001.000.md](./SRC-001.000.md), [docs/product/](./docs/product/).
