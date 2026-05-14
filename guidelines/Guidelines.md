# Project Guidelines

## Source of Truth

Use only these files as the canonical product source of truth:

- `docs/disclaimer.md`
- `docs/flow.md`
- `docs/spec.md`

If something is missing in docs, do not invent it.

If docs conflict, use this priority order:

1. `docs/disclaimer.md`
2. `docs/flow.md`
3. `docs/spec.md`

Treat docs as mandatory product constraints, not as optional context.

---

## Product Type

This project is an internal enterprise analytical web application.

It is **not**:

- a marketing website
- a landing page
- a startup promo dashboard
- a concept shot
- a dribbble-style visual experiment

All generated UI must look like a serious B2B analytical product:

- dense but readable
- structured
- state-aware
- restrained
- production-oriented

Avoid decorative UI, visual noise, and speculative product logic.

---

## Core Product Rules

- The system start point is the scenario registry `/`.
- After opening, creating, or copying a scenario, always navigate to `/map`.
- Inside the workspace there are only 4 permanent top-level sections:
  - Map
  - Projects
  - Compare
  - Ranking
- Export is **not** a permanent top-level section.
- Quick export is a local action inside the current screen.
- Advanced export is a separate module opened only from local export.
- Scenario info is read-only.
- System scenarios cannot be edited directly.
- Ranking uses only TOPSIS.
- Do not add AHP.
- Do not add sensitivity analysis.

---

## Language Rules

All user-facing content must be in Russian.

This rule is mandatory for:

- page titles
- section titles
- navigation labels
- tabs
- buttons
- form labels
- placeholders
- helper text
- hints
- validation messages
- empty states
- error states
- toasts
- tooltips
- table headers
- filter labels
- modal titles
- drawer titles
- export labels
- chart titles
- chart legends
- axis labels
- status labels
- breadcrumbs
- contextual action labels

Do not generate English UI copy.

Use English only where technically necessary, for example:

- code syntax
- library names
- route paths
- developer-facing identifiers
- internal file names
- implementation-level variable names

Even when code is written in English, all visible interface content must remain in Russian.

If docs contain mixed terminology, prefer Russian UI wording and keep English only for technical implementation artifacts.

Do not transliterate English UI copy into Russian.
Do not mix Russian and English in one visible interface unless explicitly required by docs.

---

## Documentation-First Generation

Before generating anything:

1. Identify what exactly is being requested:
   - scenario
   - screen
   - state
   - local UI layer
   - component or pattern

2. Check whether it exists in docs.

3. If it exists, follow docs strictly.

4. If it exists only partially:
   - preserve structure
   - keep the block minimal
   - mark it as not finalized if needed
   - do not invent content

5. If it does not exist in docs:
   - do not invent it
   - ask for clarification, or
   - generate only a structural placeholder with no fake content

Never fill gaps with generic SaaS patterns.

---

## Prompt Interpretation Rules

- One prompt = one screen or one state.
- Do not generate multiple flows in one output.
- Do not merge registry, map, project card, compare, ranking, and export into one composite screen unless docs explicitly require it.
- Do not mix read-only mode, edit mode, compare mode, export mode, and overlay logic in one screen unless docs explicitly require it.
- Each generated result must be scoped to one clear user goal.

---

## Screen Composition Rules

For every screen:

1. Identify the exact route or local layer.
2. Identify the exact user goal.
3. Include only the blocks needed for that goal.
4. Include only documented actions.
5. Include only documented states.
6. Keep visual hierarchy obvious.
7. Prefer structure over decoration.

Do not create extra sections “for completeness”.

---

## Anti-Hallucination Rules

Do not invent:

- new sections
- new tabs
- new roles
- new permissions
- new filters
- new KPI
- new widgets
- new actions
- new statuses
- new analytics models
- new export formats
- new charts
- new tables
- new AI features
- new assistant panels
- new recommendations
- new summaries
- new help flows

Do not use:

- lorem ipsum
- fake numbers
- synthetic analytics
- placeholder insights
- random chart data
- fake benchmark comparisons

If exact content is not documented, use a structural block only.

---

## Backlog / Stub / In-Progress Rules

If docs mark something as:

- backlog
- stub
- in progress
- not finalized
- under development

then do **not** present it as production-ready.

You may show:

- a structural placeholder
- a limited prototype shell
- a clearly marked unavailable or partial state

You must **not** show:

- fully functional UI
- deep workflows
- advanced settings
- confident fake data
- complete interaction logic

---

## Data and State Rules

Heavy screens and analytical blocks must support:

- loading
- empty
- error

Use only documented data states:

- not calculated
- in calculation
- actual
- stale after changes
- calculation error

Do not show zeroes as final values when the system is still calculating.

Do not visually imply data confidence when the documented state is incomplete, stale, or not calculated.

---

## Technology Rules

Use these libraries by default:

- **Leaflet.js** for all map-based screens and map interactions
- **Chart.js** for all charts and data visualizations

Do not use alternative libraries unless explicitly requested.

### Forbidden map alternatives

Do not use:

- Mapbox GL
- Google Maps
- OpenLayers
- custom SVG map engines
- 3D map libraries

### Forbidden chart alternatives

Do not use:

- ECharts
- ApexCharts
- Highcharts
- Recharts
- D3
- Plotly

---

## Map Rules

All map-based screens must use **Leaflet.js**.

Use Leaflet for:

- base map
- project routes
- route highlighting
- selected project state
- compare-mode selection on map
- map filtering
- route visibility by year
- map-centered scenario analysis

The `/map` screen must preserve the documented 3-zone structure:

1. KPI strip
2. central map
3. year slider

Map rules:

- the map is the primary canvas of `/map`
- KPI strip is above the map
- year slider is below the map
- local controls may exist around the map, but must not overpower it
- selected project opens a side panel
- compare mode stays a mode of the map, not a separate analytics page
- future projects after the selected year remain visible but visually de-emphasized
- use a restrained light analytical basemap style
- keep interaction enterprise-like and functional

Do not add:

- heatmaps
- clusters
- choropleths
- 3D terrain
- satellite view
- GIS editor tools
- free drawing tools
- advanced geographic analysis tools
- map storytelling UI
- fancy animated route effects

Unless docs explicitly require them, they must not appear.

---

## Chart Rules

All chart-based blocks must use **Chart.js**.

Use charts only when a chart is justified by docs or by the exact task.

If docs do not clearly require a chart, prefer:

- KPI rows
- tables
- comparison tables
- structured metric groups
- status blocks

Preferred chart types:

- line chart
- bar chart
- stacked bar chart

Use with caution:

- area chart only if it improves readability

Avoid by default:

- pie charts
- donut charts
- radar charts
- gauges
- funnels
- polar charts
- bubble charts
- decorative chart collections

Chart rules:

- each chart must support a clear analytical purpose
- each chart must have a title
- axes and legends must be readable when applicable
- do not overload one screen with many tiny charts
- charts must support the interface, not decorate it
- if the exact data structure is not documented, do not invent series or labels
- in ambiguous cases use a structural chart placeholder instead of fake chart data

---

## Registry Rules

The scenario registry is a structured operational screen, not an analytics dashboard.

Use:

- tabs
- search
- filters
- tables
- row actions
- clear scenario type distinction

Do not add:

- hero sections
- visual storytelling
- large metric walls
- promotional empty states
- onboarding carousels

The registry must remain functional and table-first.

---

## Project Card Rules

Project card screens must remain analytical and modular.

Rules:

- preserve the documented card shell
- preserve documented tabs only
- keep a stable header
- do not turn the project card into a free-form dashboard
- do not generate extra overview widgets unless documented
- edit actions must remain contextual
- do not replace contextual edit popups with one giant global form

If a tab is only partially defined:

- keep the tab shell
- use structural sections
- avoid fake metrics and fake charts

---

## Compare Rules

Compare must remain a structured comparison module.

Rules:

- compare is based on the current compare basket
- compare basket is session-based
- compare should use tables first
- when exactly 2 projects are selected, delta may be shown
- when more than 2 projects are selected, use row-level comparison emphasis instead of pairwise delta logic
- compare must not turn into ranking
- compare must not become a general dashboard

Do not add:

- radar comparisons
- recommendation engines
- auto-generated conclusions
- “best choice” banners
- AI-generated winner cards

---

## Ranking Rules

Ranking must remain a dedicated analytical module.

Rules:

- use only TOPSIS
- show documented criteria and weights
- weight editing must be explicit
- invalid weight sum must clearly block calculation
- normalization must be a clear explicit action
- results must be structured and readable
- saved ranking configuration belongs to the scenario context

Do not add:

- method selector
- AHP
- Monte Carlo analysis
- sensitivity analysis
- recommendation assistant
- portfolio optimization wizard

---

## Export Rules

Quick export:

- must remain local to the current screen
- must export current visible state
- must not behave like a global report builder

Advanced export:

- is a separate module opened from local export
- must inherit source context when docs require it
- must not be presented as fully production-ready if docs describe it as incomplete

Do not add:

- PowerPoint export unless explicitly documented and finalized
- huge report-builder workflows
- fake template galleries
- advanced publishing flows

---

## Visual Style Rules

Use:

- enterprise web app patterns
- compact spacing
- strong information hierarchy
- restrained colors
- clear tables
- clear sectioning
- predictable actions
- readable filters
- visible states
- consistent headers and toolbars

Avoid:

- startup-style dashboards
- oversized cards
- glassmorphism
- fluffy whitespace
- gradient-heavy marketing visuals
- decorative icons everywhere
- empty ornamental illustrations
- consumer mobile-app aesthetics

UI should feel closer to:

- analytical B2B software
- admin systems
- operational planning tools
- decision-support interfaces

Not to:

- pitch decks
- landing pages
- concept demos

---

## Code Project Rules

Assume this is a code-based UI project.

Prefer clear structure and separation:

- routes or views by screen responsibility
- reusable UI components for repeated patterns
- isolated map-related code
- isolated chart-related code
- no oversized monolithic screen files

Map logic should be encapsulated.
Chart logic should be encapsulated.
Do not duplicate the same logic across screens.

---

## Output Quality Rules

Every generated screen must be:

- specific
- scoped
- documented
- state-aware
- non-speculative
- visually restrained
- structurally clear

Every output must answer:

- what screen is this
- what exact user goal does it support
- what actions are available here
- what state is currently shown
- why this screen exists in the documented flow

If the answer is unclear, the screen is too vague and must be simplified.

---

## Final Rule

When in doubt:

- reduce scope
- remove invented content
- return to docs
- keep the screen structural
- prefer clarity over completeness