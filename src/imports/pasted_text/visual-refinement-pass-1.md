Use only these files as mandatory source of truth:
- docs/disclaimer.md
- docs/flow.md
- docs/spec.md
- guidelines/guidelines.md

Treat docs and guidelines as mandatory product constraints.
You are doing a visual refinement pass, not a product rewrite.

Language rules:
- All user-facing UI content must remain in Russian.
- All reports and questions must be in Russian.
- Use English only for code, route paths, library names, and developer-facing details.

Hard product constraints:
- Start point remains scenario registry `/`
- After opening, creating, or copying a scenario, always go to `/map`
- Workspace has only 4 permanent top-level sections: Map, Projects, Compare, Ranking
- Export must not become a permanent top-level section
- Scenario info remains read-only
- System scenarios cannot be edited directly
- Ranking remains TOPSIS-only
- Do not add AHP
- Do not add sensitivity analysis as an active ranking method
- Leaflet remains the map engine
- Chart.js remains the chart library
- Existing flows, route logic, calc statuses, and state logic must not be broken

Design objective:
Transform the current wireframe-like UI into a polished, light, presentation-ready enterprise interface for customer demo.

Visual direction:
- remove heavy border-driven styling almost everywhere
- reduce visual harshness
- add more air and better spacing
- separate content into islands/surfaces instead of framed boxes
- make the interface visually lighter and more mature
- where appropriate, use bento-like dashboard composition for summary/analytics blocks
- make the global navigation more compact, calmer, and better grouped
- add smooth and restrained motion for transitions, interactive states, overlays, loading, and state changes
- preserve a clean B2B analytical feel, not a marketing landing page
- keep the UI light-themed, clear, and not overloaded

Framework decision:
- Do not migrate the whole product to Material Design 3
- Do not introduce MD3 as the visual language
- You may use or align with shadcn/ui primitives if helpful technically, but the final UI must feel custom and cohesive, not like default shadcn samples
- Do not perform a large framework rewrite if a token/style-layer refinement is enough

Task:
Perform a visual refinement pass across the application shell and the main user-facing screens.

What to improve:

1. Global shell and surfaces
- Replace wireframe feeling with layered surfaces
- Reduce visible borders
- Use soft background separation, subtle shadows, gentle radius, and spacing instead of hard outlines
- Create clearer hierarchy between app background, section containers, and inner content
- Make large screens feel composed rather than boxed

2. Navigation
- Rebuild the global navigation to be more compact, cleaner, and more pleasant
- Preserve the same information architecture and top-level sections
- Improve active, hover, and focus states
- Reduce visual weight of the shell while keeping orientation clear
- Make scenario switcher / utility controls feel more integrated and less clunky

3. Layout rhythm
- Increase whitespace where the UI feels cramped
- Normalize paddings, gaps, and content density
- Make headers, toolbars, filters, cards, and tables feel part of one visual system
- Remove accidental inconsistency in spacing and grouping

4. Island composition
- Break dense content into clearer islands where useful
- Use bento-like layouts only where they improve scannability, especially:
  - KPI / summary areas
  - overview blocks
  - ranking highlights
  - analytical dashboard-like sections
- Do not force bento layout into large tables, dense forms, or screens where linear structure is more appropriate

5. Components and states
- Refine buttons, inputs, chips, tabs, cards, tables, drawers, modals, popovers, skeletons, empty states, and status blocks
- Make interactive elements feel more premium and less utilitarian
- Remove unnecessary strokes where fill, tone, shadow, spacing, or contrast is enough
- Keep strong usability and readability

6. Motion and transitions
- Add restrained, high-quality motion across:
  - page or section transitions
  - tab changes
  - drawers/modals/popovers
  - hover / press / active button states
  - skeleton-to-content transitions
  - filter and sort updates
  - navigation state changes
- Motion should be subtle, fast, and enterprise-appropriate
- Avoid flashy, playful, or excessive animation
- If there is an existing motion package in the project and it can be used safely, use it
- Do not introduce motion that hurts performance or readability

7. Data-heavy screens
- Improve visual hierarchy for tables, compare views, ranking results, and project cards
- Keep density appropriate for B2B usage, but reduce the “raw admin panel” feeling
- Make high-value metrics, labels, and controls easier to scan
- Improve grouping before adding decoration

8. Maps and analytics
- Do not interfere with Leaflet logic
- Refine map-adjacent UI: KPI strip, side panels, layer controls, compare controls, year slider zone, map summaries
- Make chart containers and analytical panels feel more integrated and less like placeholders
- Do not redesign charts into infographic style; keep them professional and restrained

Execution rules:
- Do not change product logic unless necessary for visual consistency
- Do not remove required states
- Do not add top-level modules
- Do not rewrite flows
- Do not break existing mock data or charts
- Do not replace existing core libraries
- Prefer token, layout, spacing, surface, and component refinement over structural rewrites
- Keep implementation pragmatic and production-minded

Work process:
1. First inspect the current UI structure and identify the main visual weaknesses.
2. Briefly state the visual refinement plan in Russian:
   - что меняешь в shell
   - что меняешь в навигации
   - что меняешь в surface/card system
   - где добавляешь motion
   - какие экраны сильнее всего затрагиваешь
3. Then perform the visual refinement.
4. At the end, return a concise report in Russian.

Required final report format:

# Visual refinement выполнен

## 1. Что изменено в визуальной системе
## 2. Что изменено в глобальной навигации
## 3. Что изменено в ключевых экранах
## 4. Какие анимации и переходы добавлены
## 5. Что осознанно не менялось, чтобы не сломать логику

Success criteria:
- the UI no longer feels like a wireframe
- borders are no longer the main separation tool
- the interface feels lighter, calmer, and more premium
- content is grouped into clearer islands
- navigation feels more compact and pleasant
- motion improves perceived quality without becoming flashy
- the result still feels like a serious analytical B2B system
- all documented product constraints remain intact

If any design decision would require breaking documented product logic, stop and ask a short question in Russian before proceeding.
If the response is not in Russian, it is incorrect.