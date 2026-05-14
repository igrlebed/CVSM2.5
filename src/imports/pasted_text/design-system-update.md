Use only these files as mandatory source of truth:
- docs/disclaimer.md
- docs/flow.md
- docs/spec.md
- guidelines/guidelines.md

Treat docs and guidelines as mandatory product constraints.
This task is a systemic visual redesign pass of the existing interface language, not a minor polish pass.

Language rules:
- All user-facing UI content must remain in Russian.
- All reports and questions must be in Russian.
- Use English only for code, route paths, library names, file names, and developer-facing details.

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

Current problem:
The current UI still feels like a wireframe/admin prototype.
Simple rounding, extra padding, and random animations are not enough.
The interface must be transformed into a cohesive, premium, light, modern enterprise analytical UI.

Main objective:
Rebuild the visual system of the application so the product feels intentionally designed rather than mechanically assembled.

Design direction:
- no heavy border-first styling
- no raw wireframe feeling
- no accidental spacing
- no clunky shell
- no chaotic overlay animations
- no “just add radius and padding” solutions

The new UI should feel:
- lighter
- cleaner
- calmer
- more architectural
- more grouped
- more premium
- more presentation-ready
- still serious and analytical, not marketing-like

You must work systemically across these layers:

1. Visual system foundation
Create or refine a coherent visual language for:
- page background
- section surfaces
- cards/islands
- nested panels
- separators
- spacing scale
- radius scale
- shadow/elevation scale
- typography hierarchy
- muted/supporting text
- badges/status chips
- action hierarchy

Rules:
- borders must stop being the primary separation tool
- use tonal contrast, surface layering, spacing, and soft shadow instead
- remove visual noise caused by too many framed rectangles
- increase clarity of hierarchy without adding decoration

2. Shell and navigation redesign
Rebuild the application shell visually:
- make the top navigation more compact and intentional
- reduce shell height and visual heaviness
- make active section state elegant, not loud
- integrate scenario switcher, utilities, and avatar into a cleaner right-side cluster
- make the shell feel premium and product-like, not default/admin-like
- preserve the same information architecture and top-level sections

Do not only tweak spacing.
Recompose the shell and navigation visually.

3. Screen composition
Recompose major screens so they feel designed as systems, not stacks of boxes.

Focus especially on:
- scenario registry
- map screen
- projects list
- project card
- compare
- ranking
- export screens

Use these principles:
- stronger macro-composition
- clearer grouping of related controls and data
- better rhythm between summary, controls, and dense content
- fewer giant flat canvases
- more meaningful islands
- stronger visual entry points per screen
- less “everything has equal weight”

4. Bento usage
Use bento-like layout only where it genuinely improves scanability and perceived sophistication.

Good candidates:
- KPI strips
- overview blocks
- summary areas
- ranking highlights
- compare summaries
- export summaries

Do not force bento into:
- large tables
- long forms
- edit dialogs
- screens where linear flow matters more than dashboard composition

5. Data-heavy UI refinement
For enterprise-heavy screens:
- improve hierarchy in tables and dense cards
- reduce visual fatigue
- make high-signal metrics stand out
- reduce accidental clutter
- improve header/filter/toolbar composition
- make tables feel integrated into the design system, not pasted in

6. Overlay redesign
Systemically refine:
- modal
- drawer
- popover
- tooltip
- toast
- dropdown

Requirements:
- overlays must open from their intended origin or from centered/fade behavior appropriate to the component
- modals must not fly in from the top-left corner
- transform origin must be correct
- use restrained scale/fade/slide motion depending on overlay type
- all overlay surfaces must match the same visual language as the rest of the app
- overlay padding, header spacing, footer spacing, and action grouping must be consistent

7. Motion system
Build a restrained enterprise motion system.

Motion must be:
- subtle
- smooth
- fast
- consistent
- purposeful

Apply motion to:
- page/section transitions
- tab switches
- filter updates
- sorting changes
- drawers/modals/popovers
- button hover/press states
- skeleton-to-content transitions
- nav active state
- compare/ranking interactions where appropriate

Do not:
- animate from wrong screen coordinates
- use exaggerated springiness
- use playful or consumer-app motion
- add motion everywhere blindly

If a motion library already exists in the project and is safe to use, use it correctly.
Fix broken overlay animations first.

8. Component refinement
Refine the entire component family so they feel like one product:
- buttons
- icon buttons
- tabs
- segmented controls
- chips
- filters
- selects
- inputs
- tables
- cards
- KPI blocks
- empty states
- loading states
- error states
- drawers
- modals
- popovers
- quick actions

Each component should:
- match the new visual system
- feel lighter and more premium
- preserve clarity and accessibility
- avoid heavy borders as default styling

9. Maps and analytics surfaces
Do not change Leaflet logic or chart logic.
But visually refine:
- map KPI strip
- map controls
- year slider area
- side summaries
- compare basket area
- chart containers
- ranking controls
- analytics panels

These parts should feel integrated and polished, not like separate prototype fragments.

10. No superficial solution
This task is not complete if the result is just:
- more rounded corners
- slightly bigger padding
- one more shadow
- one generic animation preset

The result is acceptable only if the interface visibly changes at the system level.

Implementation expectations:
- Prefer design-token, shell, spacing, composition, component, and motion refactor over local cosmetic edits
- Keep it pragmatic and compatible with the current codebase
- Do not rewrite the whole app from scratch
- Do not destroy stable functionality
- Improve the UI language across the app, not only on one or two screens

Required work process:
1. First inspect the current UI and identify the systemic visual problems.
2. Then produce a short redesign plan in Russian with these sections:
   - какие системные проблемы UI ты видишь
   - как меняешь visual system
   - как меняешь shell/navigation
   - как меняешь overlays and motion
   - какие экраны будут затронуты сильнее всего
3. Then implement the redesign.
4. Then run a final self-check.

Final self-check must verify:
- the interface no longer feels wireframe-like
- borders are no longer the primary separation method
- overlays animate correctly and do not jump from the top-left corner
- shell/navigation feels compact and cohesive
- major screens feel compositionally designed, not boxed
- data-heavy screens remain readable
- product logic and documentation constraints remain intact

Required final report format in Russian:

# Системное UI-обновление выполнено

## 1. Какие системные проблемы были устранены
## 2. Что изменено в visual system
## 3. Что изменено в shell и навигации
## 4. Что изменено в overlays и motion
## 5. Какие экраны переработаны сильнее всего
## 6. Что намеренно не менялось ради сохранения логики

Hard constraints:
- Do not add new top-level product modules
- Do not break documented flows
- Do not replace Leaflet
- Do not replace Chart.js
- Do not switch to MD3 as the product visual language
- You may use shadcn/ui primitives only as implementation support, not as the final visual identity
- Do not return a cosmetic-only result
- If a design decision risks breaking documented logic, stop and ask a short question in Russian first

If the response is not in Russian, it is incorrect.