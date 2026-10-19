---
name: code-simplify
description: Simplify recently changed code for clarity and maintainability while preserving behavior. Use when the user asks to simplify, clean up, or refactor code without functional changes. Do not invoke for ordinary feature implementation or behavior-changing redesigns.
---

# Code Simplify

Make the smallest set of worthwhile changes that leaves the selected code easier to understand without changing observable behavior.

## Establish the boundary

1. Read the repository instructions and the surrounding implementation before editing.
2. Resolve the cleanup scope in this order: files or symbols named by the user; code changed during the current task; otherwise the relevant uncommitted diff. If the user supplies a branch, commit, or diff base, use it as the boundary.
3. Limit edits to changed sections and the smallest amount of adjacent code needed for a coherent cleanup. Preserve unrelated and pre-existing user changes.
4. Identify the project's existing test, type-check, lint, and formatting commands from repository configuration rather than inventing commands.

If the requested scope cannot be distinguished safely from unrelated work, inspect and report the ambiguity before editing.

## Simplify

Prefer explicit, locally understandable code over fewer lines.

- Flatten unnecessary nesting and remove duplication when the resulting control flow is easier to follow.
- Use names that expose purpose. Keep comments that explain intent, constraints, or surprising decisions; remove comments that only restate the code.
- Remove an abstraction only when it no longer protects a useful responsibility. Extract one only when it gives a concept a clear name or separates responsibilities.
- Replace dense expressions and nested conditional expressions with readable branches when they obscure evaluation order or edge cases.
- Remove dead code only when the selected scope and available evidence make it demonstrably unreachable or unused.
- Follow the repository's established language, framework, typing, import, component, and error-handling conventions.

Every edit must have a concrete readability or maintainability benefit. Leave code unchanged when a proposed rewrite is merely stylistic, shorter, or equally complex in a different shape.

## Preserve behavior

Keep public APIs, types, return values, mutations, side effects, errors, logging, user-visible output, and edge cases unchanged. Treat evaluation order, async sequencing, concurrency, retries, caching, resource lifetime, and performance-sensitive paths as behavior when callers can observe them.

Keep serialized formats, database interactions, network contracts, accessibility semantics, and security checks intact. Do not add dependencies or expand the cleanup into an architectural redesign unless the user explicitly requests it.

When behavior is insufficiently covered or understood, choose the conservative form and state the uncertainty instead of making a speculative simplification.

## Verify completion

1. Review the final diff and account for every changed hunk. Remove accidental formatting churn and unrelated edits.
2. Run the narrowest relevant existing tests and checks, expanding only when risk justifies it.
3. If a check fails, determine whether the cleanup caused the failure before making further changes.
4. Finish only when the diff stays within scope, each edit has a clear benefit, and available checks support behavior preservation.

Report the meaningful simplifications, the checks run and their results, and any remaining uncertainty or unverified behavior.
