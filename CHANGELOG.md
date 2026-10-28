# Журнал изменений AIS

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/lang/ru/).

---

## [0.5.0] — 2026-10-29

### Изменено

- **Контур SIP удалён из `main`**: `backend/`, `landing/`, `plugins/`, `packages/`, `docker/`
  и вложенный `sec-scanner-workspace/` исключены, чтобы они не влияли на рантайм AIS, тесты,
  discovery и CI. Коммерческий продукт Sec Scanner живёт в отдельном репозитории.
- Discovery: обход по `lstatSync` без захода в symlink-каталоги — счётчик файлов совпадает
  с `git ls-files`.
- Discovery: workspace-юниты ограничены каталогами с `package.json`.
- Tech stack определяется по расширениям файлов.
- Fallback-без-LLM: `scan-fact` остаются верифицированными, `lexical-match` — неверифицированные;
  добавлен блок «что этот ответ есть и чем не является».
- Импорт репозитория по закреплённому commit (`ref`), лимиты вынесены в env, `INVALID_REF` → 400,
  `REF_NOT_FOUND` → 404.
- Path security: платформенно-корректный разбор POSIX/Windows, защита от traversal и
  sibling-prefix атак.

## [0.4.0] — 2026-10-28

### Добавлено

- MVP UI: импорт публичного GitHub-репозитория, вопросы об архитектуре, источники file:line.
- Регрессионные тесты для path security, лимитов резолвера, fallback-анализа и discovery.

## [0.3.0] — 2026-10-27

### Добавлено

- Execution engine, evidence loop, interaction layer, когнитивный рантайм.
