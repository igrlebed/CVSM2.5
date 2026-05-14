Use only these files as mandatory source of truth:
- docs/disclaimer.md
- docs/flow.md
- docs/spec.md
- guidelines/guidelines.md

Treat docs and guidelines as mandatory product constraints, not optional context.
If docs conflict, use priority:
1. docs/disclaimer.md
2. docs/flow.md
3. docs/spec.md
4. guidelines/guidelines.md

Language rules:
- All user-facing interface content must be in Russian.
- All mock data labels, chart labels, legends, axis labels, empty states, helper text, modal titles, buttons, tooltips, status labels, table headers, filters, section titles, and messages must be in Russian.
- All progress reports, clarification questions, and final summaries must also be in Russian.
- Use English only for code, route paths, library names, file names, and developer-facing implementation details.

Product rules:
- Start point is scenario registry `/`
- After opening, creating, or copying a scenario, always go to `/map`
- Workspace has only 4 permanent top-level sections: Map, Projects, Compare, Ranking
- Export is not a permanent top-level section
- Scenario info is read-only
- System scenarios cannot be edited directly
- Ranking uses only TOPSIS
- Do not add AHP
- Do not add sensitivity analysis as an active ranking method selector

Technology rules:
- Use Leaflet.js for all map-based screens and interactions
- Use Chart.js for charts where charts are justified or needed for demo realism
- Do not use alternative map libraries or chart libraries

State rules:
- Support loading / empty / error where relevant
- Use documented calculation states only: not calculated / in calculation / actual / stale after changes / calculation error

Execution mode:
You are now working in demo-ready prototype completion mode for a customer presentation.

Main goal:
Bring the current implementation to a polished, believable, populated demo-ready working contour that:
1. fixes all confirmed implementation gaps and mismatches against current documentation,
2. upgrades backlog/stub/in-progress areas into demo-ready prototype functionality where it is safe and reasonably supported by docs,
3. fills the product with coherent mock data and realistic charts so the prototype feels complete and presentation-ready,
4. documents all implemented backlog/stub/in-progress functionality in a dedicated docs file.

Important distinction:
- For current-scope documented functionality: implement properly according to docs.
- For backlog/stub/in-progress functionality: you may implement a demo-ready prototype version only if the docs give enough structure to do so credibly.
- Do not present speculative functionality as fully product-final if docs do not support that.
- If a backlog/stub/in-progress feature lacks enough information for a credible prototype, stop and ask clarifying questions before implementing it.

Your workflow must be:

Phase 1 — Brief verification and implementation plan
- Inspect the current implementation.
- Identify all confirmed implementation gaps vs docs and guidelines.
- Identify backlog/stub/in-progress areas that can be safely upgraded into demo-ready prototype features.
- Identify areas where mock data must replace placeholders or weak filler content.
- Identify screens/tabs/modules where Chart.js charts should be added or completed for demo realism.
- Identify any critical missing information that blocks credible implementation.

Output at the start:
Return only a short structured implementation plan in Russian:
- Что исправляешь по документации
- Что добираешь из backlog/stub/in-progress для демо
- Где добавляешь моковые данные
- Где добавляешь графики на Chart.js
- Какие вопросы нужно задать мне перед началом, if any

Decision rule:
- If any critical information is missing for backlog/demo implementation, stop after Phase 1 and ask only the necessary clarifying questions in Russian.
- If documentation is sufficient, continue directly to implementation without waiting.

Phase 2 — Fix documentation gaps
Implement all confirmed mismatches and missing required behavior according to docs and guidelines.

This includes:
- visible UI copy mismatches
- dead controls where docs require active behavior
- missing documented flows
- incomplete documented edit coverage where docs clearly require it
- missing state handling where required by docs
- any confirmed route/navigation inconsistency
- any confirmed Russian-language inconsistency
- any confirmed mismatch between compare, ranking, export, project card, map, and scenario logic

Do not redesign the product for style exploration.
Preserve the existing architecture unless a change is required to meet docs.

Phase 3 — Demo-ready backlog/stub/in-progress implementation
For backlog/stub/in-progress features:
- implement only what can be credibly inferred from docs,
- keep the architecture consistent,
- keep labels and behavior honest,
- avoid fake advanced analytics if the underlying structure is unknown,
- prefer structured, plausible prototype UI over empty placeholders when possible,
- use mock data where needed to make these areas presentation-ready.

Rules for backlog implementation:
- You may convert a backlog/stub/in-progress area into a demo-ready prototype block if the docs provide enough directional structure.
- You must not silently invent critical business logic.
- If business rules are unclear, stop and ask me.
- If the docs clearly indicate something should remain not fully final, the implementation may still feel complete for demo purposes, but it must not introduce contradictory product logic.

Examples:
- A backlog analytical section may become a filled structural demo block with coherent mock metrics and simple Chart.js support if docs provide enough context.
- A backlog export/report area may remain visibly prototype-like, but should feel populated and usable in a demo flow if that does not contradict docs.
- A stub feature may be upgraded into a believable contour if consistent with flow/spec and clearly not dependent on unknown business rules.

Phase 4 — Mock data population
Populate all major scenarios, projects, comparison views, ranking tables, map summaries, project cards, export presets, and analytical sections with coherent mock data.

Mock data requirements:
- all visible data must be in Russian where user-facing
- mock data must be internally consistent across scenario registry, map, projects list, project card, compare, ranking, and export
- scenario/project counts must match related screens
- project names, statuses, authors, years, and project types must match across screens
- KPI aggregates should look believable relative to project sets
- comparison tables must not contradict project card values
- ranking inputs and outputs must align logically
- export presets and summaries must refer to real visible mock content
- calculation statuses must be used consistently

Use realistic Russian enterprise naming for:
- scenarios
- project names
- authors
- transport/infra/finance/social/risk labels
- statuses
- comparison and ranking dimensions

Do not use lorem ipsum.
Do not use obviously fake placeholder values like “Project 1”, “User 1”, “Test scenario”, or “123”.
Do not leave high-visibility empty blocks where coherent mock content can be added safely.

Phase 5 — Chart.js charts
Where charts are appropriate for demo realism and are supported or reasonably implied by docs:
- implement them with Chart.js
- use Russian titles, legends, labels, axes, statuses, and tooltips
- keep a restrained enterprise visual style
- avoid decorative chart walls
- use charts only where they help the screen feel analytically complete

Chart rules:
- If a chart concept is clearly supported by docs, implement it.
- If a chart area is underspecified but the surrounding section is documented and mock data can be coherent, you may add a simple plausible Chart.js chart for demo purposes.
- If a chart would require inventing critical business logic, stop and ask me first.
- Do not use any chart library other than Chart.js.

Phase 6 — Backlog documentation deliverable
If during this run you implement any functionality that was previously marked in docs as backlog, stub, or in progress, you must create or update the file:

- /docs/backlogsfunction.md

This file must be written entirely in Russian.

This file must document only the backlog/stub/in-progress functionality that was actually implemented during this run.

Required structure of /docs/backlogsfunction.md:

# Реализованные backlog-функции

## 1. Сводка
- какие backlog/stub/in-progress функции были реализованы
- в каком режиме: полноценная реализация или demo-ready prototype
- почему они были реализованы на этом этапе

## 2. Таблица покрытия
For each implemented backlog/stub/in-progress function provide a table row with:
- ID / reference from docs if available
- Название функции
- Исходный статус в документации (backlog / stub / in progress)
- Где реализовано в интерфейсе
- Тип реализации (production-like / demo-ready prototype / structural prototype)
- Что покрыто
- Что не покрыто
- Какие допущения были сделаны
- Нужны ли дальнейшие уточнения

## 3. Сопоставление с ТЗ
For each implemented function:
- на какой раздел flow/spec/disclaimer/guidelines она опирается
- как именно текущая реализация соотносится с документацией
- есть ли отклонения от документации
- является ли реализация временной demo-версией

## 4. Оставшиеся пробелы
- что всё ещё нельзя считать завершённым
- что осталось backlog/stub/in-progress
- какие данные или решения нужны от заказчика / от меня

## 5. Риски
- какие реализованные backlog-функции требуют последующей валидации
- где использованы mock data или упрощённая логика
- что нельзя трактовать как финальную продуктовую спецификацию

Rules for /docs/backlogsfunction.md:
- write the file only in Russian
- document only what was actually implemented in this run
- do not describe features that were not touched
- do not claim full production readiness unless it is clearly supported by docs
- clearly separate real implementation from demo-only implementation

Phase 7 — Final self-check
Before finishing, verify:
- all visible UI copy is in Russian
- all new mock data is coherent and presentation-ready
- no extra top-level sections were added
- `/map` remains the first scenario screen
- system scenarios are not directly editable
- compare basket remains session-only
- ranking remains TOPSIS-only
- Export is still not a permanent top-level section
- Leaflet remains the map engine
- Chart.js is the only chart library used
- loading / empty / error states still exist where relevant
- documented calc statuses still exist and remain coherent
- demo additions do not break documented flows
- backlog/stub/in-progress implementations that were added are documented in `/docs/backlogsfunction.md`

Output rules:
- If questions are required, stop and ask them in Russian before implementation.
- If no questions are required, briefly state the implementation plan in Russian and then proceed with implementation.
- When implementation is complete, return a concise completion report in Russian with these sections:

# Результат реализации

## 1. Что исправлено по документации
## 2. Что добавлено для демо из backlog/stub/in-progress
## 3. Какие моковые данные добавлены
## 4. Где добавлены графики Chart.js
## 5. Что создано или обновлено в `/docs/backlogsfunction.md`
## 6. Что осталось осознанно не реализованным из-за нехватки данных

Priority for this run:
presentation completeness and believable data-filled prototype, while preserving documented product logic.

Hard constraints:
- Do not redesign the product for style exploration.
- Do not add new top-level navigation modules.
- Do not add AHP or sensitivity analysis as active ranking methods.
- Do not replace Leaflet or Chart.js.
- Do not leave visible English UI copy.
- Do not keep high-visibility empty placeholder screens where a coherent mock-filled demo block can be built safely from docs.
- Do not silently invent critical business logic if docs are insufficient — ask first.
- If the answer or clarification questions are not in Russian, the result is incorrect.