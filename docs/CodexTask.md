# Codex Implementation Task: Сопоставление сценариев

## Task Overview
Implement the "Сопоставление сценариев" (Scenario Comparison) functionality as specified in [ScenarioComparison.md](./ScenarioComparison.md). This is a critical analytical feature that allows users to compare 2-4 scenarios by KPIs, project composition, and temporal profiles to support evidence-based decision making.

The implementation follows an MVP-first approach with planned extensions, ensuring early delivery of core value while maintaining architectural integrity.

## Key Definitions
- **Сопоставление сценариев**: Separate analytical screen at registry level for comparing 2-4 scenarios
- **Сравнение проектов**: Existing `/compare` section within active scenario (do not modify)
- **Baseline**: Selected scenario serving as reference point for deltas
- **Набор сопоставления**: URL-driven list of scenarioIds (2-4 items)

**IMPORTANT**: Use ONLY "Сопоставление сценариев" in all documents, UI strings, and code to avoid confusion with existing `/compare`.

## Implementation Approach
Follow the phased approach outlined in specification:
1. **MVP**: Core KPI comparison + "Состав и отличия" tab, entry from registry only
2. **v1.1**: All entry points, expanded KPIs/tabs, "Только отличия" toggle
3. **v1.2**: Advanced visualizations, export formats, Ranking integration
4. **v1.3**: Collaborative features, templates, history

## Phase 1: MVP Implementation

### Goal
Deliver basic scenario comparison with KPI overview and project difference analysis accessible from the scenario registry.

### Acceptance Criteria
- User can select 2-4 scenarios in registry and initiate comparison
- System displays KPI cards (NPV, IRR, Investments, Пассажиропоток, Прирост ВВП, Население в зоне влияния, Срок окупаемости, Рейтинговый балл TOPSIS) with deltas to baseline
- "Состав и отличия" tab shows project inclusion/exclusion status across scenarios
- Baseline selection works correctly
- Read-only mode enforced (no scenario editing)
- URL preserves state: `/registry/compare?scenarios=id1,id2,id3&baseline=id1`
- Proper loading/error/empty states
- Accessibility compliance (keyboard navigation, ARIA labels, color contrast)

### Detailed Steps

#### 1. Foundation & Routing
- [ ] Add new route `/registry/compare` in `src/app/router.tsx`
- [ ] Create `ScenarioCompareScreen` component skeleton
- [ ] Set up URL parameter parsing for `scenarios` and `baseline`
- [ ] Implement basic layout with breadcrumb: "Реестр сценариев / Сопоставление сценариев"

#### 2. State Management
- [ ] Extend `ScenarioContext` to fetch metadata for multiple scenarios
- [ ] Create `ScenarioCompareContext` for:
  - Selected scenario IDs
  - Baseline scenario ID
  - Active tab
  - "Только отличия" toggle state
  - Loading/error states per scenario
- [ ] Implement context providers and hooks

#### 3. Registry Modifications
- [ ] Add multi-select mode to `RegistryScreen`:
  - Checkbox in first column (visible on hover or in "Выбрать" mode)
  - Sticky bottom bar: "Сопоставить (N)" when 2+ selected
  - Disable checkboxes when 4 already selected
- [ ] Add micro-signals to scenario rows:
  - Last recalculation date
  - Data validity status badge
  - Difference from approved scenario indicator
  - Source for copied scenarios
- [ ] Implement baseline selection dialog
- [ ] Add validation gates (min 2, max 4, valid baseline)

#### 4. UI Components
Create these reusable components:
- [ ] `ScenarioCompareHeader`: Breadcrumb, scenario chips, baseline selector, "Только отличия" toggle, Export button
- [ ] `ScenarioCompareKPIStrip`: 8 KPI cards with baseline value, best/worst, delta visualization
- [ ] `ScenarioCompareTabs`: Tab container for KPI, Состав и отличия, Время́нный профиль
- [ ] `ScenarioCompareUtilityRail`: Actions - Открыть сценарий, Сделать активным, Экспорт, Поделиться
- [ ] `ProjectDiffTable`: Core component for "Состав и отличия" tab showing project inclusion matrix
- [ ] `GroupedBarChart`: For KPI visualization (baseline color-coded)

#### 5. Core Screens
- [ ] Implement `ScenarioCompareScreen` orchestrating the components
- [ ] Add skeleton loading states for all sections
- [ ] Implement error states with retry options
- [ ] Add empty state when <2 scenarios selected
- [ ] Implement partial data state warnings

#### 6. Data Flow & Logic
- [ ] Implement project matching algorithm:
  - Use stable `projectId` for system projects (8 утверждённых)
  - For user projects: fuzzy match by `originScenarioId` + name + route (>80% similarity = same project)
  - Build union of all projectIds across scenarios
- [ ] Calculate KPI deltas:
  - Absolute difference to baseline
  - Percentage difference (where applicable)
  - Color coding: green for improvement, red for degradation (consider KPI-specific interpretation)
- [ ] Implement "Только отличия" toggle logic (hide rows/columns with no variance)
- [ ] Add timeline/gantt for Время́нный профиль tab (yearly slices 2030-2050)

#### 7. Navigation & Actions
- [ ] Implement action handlers:
  - Открыть сценарий → navigate to `/map` of selected scenario
  - Сделать активным → confirm then set as active scenario (with fallback to `/map`)
  - Экспорт → trigger export of current tab (Excel/PDF/PNG)
  - Поделиться → copy current URL to clipboard
  - Вернуться в реестр → navigate to `/`
- [ ] Ensure active scenario remains unchanged during comparison (read-only guarantee)

#### 8. Accessibility & Quality
- [ ] Implement full keyboard navigation
- [ ] Add ARIA labels and roles
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add focus traps for modals/dialogs
- [ ] Test with screen readers
- [ ] Implement proper error boundaries
- [ ] Add loading skeletons that match content dimensions

### Phase 1 Estimated Effort: 3-4 weeks

## Phase 2: v1.1 Extensions

### Goal
Complete entry point coverage and enhance analytical capabilities.

### Acceptance Criteria
- All three entry points work: registry, dropdown active scenario, внутри сценария
- Full KPI set (all 8 mandatory KPIs) implemented
- "Только отличия" toggle functional across all tabs
- Baseline switching without page reload
- Enhanced project diff with parameter change detection
- URL state persistence for tabs and filters

### Detailed Steps
- [ ] Implement overlay selector for scenario selection (reused from all entry points)
- [ ] Add `Сопоставить с другим` to dropdown активного сценария
- [ ] Add `Сопоставить с другими` CTA to scenario workspace header/kebab menu
- [ ] Ensure all paths lead to `/registry/compare` with pre-filled selections
- [ ] Add remaining KPI tabs: Эффективность, Риски и ограничения (stubbed for v1.2)
- [ ] Implement parameter change detection in project diff (год запуска, длина, CAPEX)
- [ ] Add hover tooltips showing exact parameter differences
- [ ] Enhance grouped bar chart with interactivity (sorting, highlighting)
- [ ] Implement persistent URL state for: tab selection, toggle states, sort order
- [ ] Add validation warnings for `in_calculation` and `stale_after_changes` baselines

### Phase 2 Estimated Effort: 2-3 weeks

## Phase 3: v1.2 Advanced Features

### Goal
Add sophisticated visualizations and integration capabilities.

### Acceptance Criteria
- Advanced visualizations: waterfall charts, contribution tables
- Multiple export formats with options
- Integration with Ranking (pre-filled baseline)
- Performance optimized for 4-scenario comparison
- Comprehensive error handling and recovery

### Detailed Steps
- [ ] Implement contribution tables showing project impact on KPI deltas
- [ ] Add waterfall charts for NPV/ВВП decomposition (stubbed, full in v1.3)
- [ ] Enhance export functionality:
  - Format selection dialog (Excel/PDF/PNG)
  - Option to include/exclude current filters
  - Header with scenario list and timestamp
  - Proper formatting for each format
- [ ] Implement integration with Ranking:
  - Action to "Перейти в Ranking с предзаполненным baseline"
  - Pass selected baseline to Ranking context
- [ ] Optimize performance:
  - Progressive loading of scenario data
  - Cache scenario metadata in ProjectsContext
  - Lazy load tab content until activated
  - Debounce expensive calculations
- [ ] Add comprehensive error boundaries with recovery options
- [ ] Implement retry mechanisms for failed data loads
- [ ] Add offline state handling (if applicable)

### Phase 3 Estimated Effort: 3-4 weeks

## Phase 4: v1.3 Collaborative Features

### Goal
Add social and productivity enhancements.

### Acceptance Criteria
- Users can save and reuse comparison configurations
- Commenting and discussion on comparisons
- Template library for common analysis patterns
- Comparison history tracking

### Detailed Steps
- [ ] Implement "Избранные наборы" in user profile:
  - Save scenario selections + baseline + tab configuration
  - Quick load from dashboard/sidebar
  - Sharing capabilities with access control
- [ ] Add commenting system:
  - Threaded comments on specific KPIs or project differences
  - Resolution tracking
  - Notifications
- [ ] Create template library:
  - Pre-built comparisons (e.g., "Базовый vs Оптимизированный", "Фаза 1 vs Полная реализация")
  - User-created template saving
  - Template categorization
- [ ] Implement comparison history:
  - Track recent comparisons per user
  - Quick restore from history
  - Export history for audit

### Phase 4 Estimated Effort: 2-3 weeks

## Technical Requirements & Constraints

### State Management
- Do NOT modify active scenario during comparison (strict read-only)
- Use URL-driven state for shareability
- Implement proper cleanup on unmount to prevent memory leaks
- Handle race conditions in parallel data loading

### Performance
- Target: <2s initial load for 4 scenarios with meta data
- Target: <500ms tab switches
- Implement virtualization for large project lists (>100 projects)
- Cache expensive computations where appropriate

### Error Handling
- Graceful degradation for partial data failures
- Clear user-facing error messages with recovery options
- Distinguish between user errors (selection validation) and system errors (data loading)
- Implement retry mechanisms with exponential backoff

### Accessibility (WCAG 2.1 AA)
- Full keyboard navigability
- ARIA labels for all interactive elements
- Minimum 4.5:1 color contrast for text and meaningful icons
- Focus indicators visible and logical
- Screen reader compatible labels and descriptions
- Responsive design for mobile/tablet

### Testing Strategy
- Unit tests for:
  - Project matching algorithm
  - Delta calculations
  - State transitions
  - Utility functions
- Integration tests for:
  - Full user flows from each entry point
  - URL state persistence
  - Action handler chains
- E2E tests for critical paths:
  - Registry → select → compare → analyze → export
  - In-scenario → compare → analyze → return
  - Error state recovery
- Accessibility testing with axe-core or similar
- Performance testing with Lighthouse

## Dependencies & Prerequisites

### Required Existing Systems
- Functional scenario registry with CRUD operations
- Working project data model with KPI calculations
- Active scenario context management
- Existing `/compare` for project comparison (reference for patterns)
- Export module infrastructure
- Notification/toast system (Sonner)
- Date formatting utilities (date-fns)
- Charting library (Chart.js or similar)

### New Components to Create
```
src/app/screens/
  ScenarioCompareScreen.tsx

src/app/components/scenario-compare/
  ScenarioCompareHeader.tsx
  ScenarioCompareKPIStrip.tsx
  ScenarioCompareTabs.tsx
  ScenarioCompareUtilityRail.tsx
  ProjectDiffTable.tsx
  GroupedBarChart.tsx
  BaselineSelector.tsx
  ScenarioSelectorOverlay.tsx

src/app/contexts/
  ScenarioCompareContext.ts

src/app/hooks/
  useScenarioCompare.ts
  useProjectMatching.ts
```

## References & Related Documents
- [ScenarioComparison.md](./ScenarioComparison.md) - Full functional specification
- [Spec.md](./Spec.md) - Overall system specification
- [Conventions.md](./Conventions.md) - UI/UX conventions
- [Flow.md](./Flow.md) - User flow documentation
- [Glossary.md](./Glossary.md) - Term definitions
- [AtomicAnchors.md](./AtomicAnchors.md) - Tracking identifiers
- [Permissions.md](./Permissions.md) - Access control matrix
- [StatesMatrix.md](./StatesMatrix.md) - State handling patterns

## Monitoring & Success Metrics

### Adoption Metrics
- Percentage of users accessing scenario comparison feature
- Average number of scenarios compared per session
- Most common entry point used
- Feature retention rate (weekly/monthly usage)

### Performance Metrics
- Screen load time (p50, p95)
- Tab switch latency
- Memory usage during comparison
- Error rate and recovery success

### Quality Metrics
- Accessibility audit score
- User satisfaction (NPS/CSAT for feature)
- Reduction in support tickets related to scenario analysis
- Time-to-insight for comparative analysis tasks

## Rollback Plan
Since this is a new feature (not modifying existing core functionality):
1. Feature flag control via environment variable or launchdarkly equivalent
2. Ability to disable route via router configuration
3. Database migrations are additive only (no schema breaking changes)
4. UI additions are in new components/routes, no existing UI modified

## Appendix: Definition of Ready
Before starting any phase, ensure:
- [ ] Specification is complete and approved
- [ ] UI/UX mockups reviewed (if applicable)
- [ ] Technical dependencies identified and available
- [ ] Acceptance criteria are testable
- [ ] Effort estimates reviewed with team
- [ ] Definition of Done agreed upon

## Appendix: Definition of Done
For each user story/task:
- [ ] Code written and self-reviewed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests covering critical paths
- [ ] Code reviewed by peer
- [ ] Deployed to staging environment
- [ ] QA approved
- [ ] Documentation updated (if needed)
- [ ] Deployed to production with feature flag OFF
- [ ] Feature flag enabled for gradual rollout
- [ ] Post-deployment monitoring confirmed