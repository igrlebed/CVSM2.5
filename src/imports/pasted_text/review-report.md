Use only these files as mandatory source of truth:
- docs/disclaimer.md
- docs/flow.md
- docs/spec.md
- guidelines/guidelines.md

Treat these files not as implementation instructions only, but also as the subject of review.

Language rules:
- The full report must be written in Russian.
- All section titles, explanations, findings, and recommendations must be in Russian.
- Use English only for route paths, code-like identifiers, library names, and direct file references when necessary.

Context:
The documentation was written quickly and is not assumed to be final or fully reliable.
Your task is not to defend the documentation, but to review it critically.

Task:
Perform a full review of the current documentation set and its coverage of the product requirements.

Review goals:
1. Evaluate how complete, consistent, and implementation-ready the documentation is.
2. Evaluate whether the documented flows are strong, logical, and usable.
3. Identify contradictions, ambiguities, weak spots, missing rules, overcomplicated areas, and underdefined functionality.
4. Identify places where the documentation likely causes weak prototype decisions or unstable implementation quality.
5. Assess how well the current docs cover the actual product contour and customer demo needs.
6. Propose how to strengthen the prototype through documentation improvements, flow corrections, scope clarifications, and better prioritization.

Important:
- Do not implement anything.
- Do not generate code.
- Do not generate UI.
- Do not rewrite all docs from scratch.
- First review and diagnose the documentation quality itself.
- Be direct and critical, but professional.
- Do not soften obvious problems.
- Do not praise weak areas just to be polite.

Review dimensions:
Please review the docs across all of these dimensions:

1. Product coverage
- what parts of the product are well covered
- what parts are weakly covered
- what parts are missing
- what parts are covered too vaguely to implement confidently

2. Flow quality
- whether the user flows are complete and coherent
- whether transitions between screens/states are well defined
- whether fallbacks and edge cases are documented
- whether core сценарный flow is strong enough for enterprise usage
- whether there are dead ends or weak interaction loops

3. Functional clarity
- where functionality is clearly specified
- where functionality is ambiguous
- where the docs leave too much room for interpretation
- where a model or developer would likely invent behavior because docs are insufficient

4. State coverage
- loading / empty / error
- not calculated / in calculation / actual / stale after changes / calculation error
- permission-dependent states
- system scenario vs user scenario differences
- whether states are consistently defined and applied

5. Architecture and navigation logic
- route logic
- top-level navigation logic
- scenario context logic
- map / projects / compare / ranking relationship
- export placement and behavior
- whether the documented app structure is stable and convincing

6. Prototype readiness
- which parts of the docs are good enough for a believable customer-facing prototype
- which parts are too raw or too abstract for demo use
- which backlog/stub areas can safely be prototyped
- which areas are too underspecified and should not be prototyped without clarification

7. Requirement coverage and traceability
- whether the docs are traceable enough to implementation
- whether major features can be mapped clearly from requirement to flow to screen/state
- where coverage is fragmented or scattered
- where IDs / references / naming are inconsistent or difficult to use

8. Content quality
- terminology consistency
- naming consistency
- duplication
- contradictory descriptions
- mixed abstraction levels
- places where the same thing is described differently
- places where wording itself creates confusion

9. Risks for the prototype
- where the current docs are likely to produce bad UX
- where the current docs are likely to produce misleading demo behavior
- where the current docs are likely to create technical churn
- where the prototype may look weaker than it should because docs are weak, not because implementation is weak

10. Recommendations
- what to fix first in the docs
- what to clarify first
- what to simplify
- what to move out of scope
- what to promote from backlog into demo-ready guidance
- what to explicitly freeze to avoid design drift
- what would most strongly improve the prototype quality in the shortest time

Required output format in Russian:

# Ревью документации и покрытия ТЗ

## 1. Общая оценка документации
Give a concise but honest assessment of the documentation quality as a working source of truth.

## 2. Что в документации уже сильное
List the parts that are strong, clear, and useful.

## 3. Узкие места и недочёты
List the weak points.
For each item:
- в чём проблема
- почему это важно
- к чему это приводит в прототипе или реализации

## 4. Противоречия и неоднозначности
List contradictions, scattered logic, ambiguous rules, or places where multiple interpretations are possible.

## 5. Пробелы покрытия ТЗ
Identify what is missing, underdescribed, or not sufficiently traceable from requirements to flow and screens.

## 6. Риски для прототипа
Describe where the current docs will likely weaken the customer-facing prototype.

## 7. Что можно усилить быстро
Provide practical high-impact improvements that would quickly increase prototype quality.

## 8. Что нужно переписать или переформулировать
Call out the parts of the docs that are weak enough that they should be rewritten, not just patched.

## 9. Приоритетный план улучшения документации
Create a prioritized improvement plan:
- P0: critical documentation problems blocking good implementation
- P1: major flow/logic ambiguities hurting product quality
- P2: coverage gaps and consistency issues
- P3: wording, structure, and maintainability improvements

## 10. Как усилить сам прототип через правку документации
Give specific recommendations not only for docs, but for how improved docs would translate into a stronger prototype for customer demo.

Rules:
- Be specific.
- Use examples from the docs when useful.
- Do not review implementation code — review the documentation itself.
- Focus on the practical usefulness of the docs for product design, prototype quality, and implementation stability.
- If some area is acceptable but still weak, say so directly.
- Do not end with vague encouragement. End with the prioritized plan.

Final instruction:
Return only the report in Russian.
If the report is not in Russian, it is incorrect.