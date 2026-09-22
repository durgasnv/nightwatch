# Nightwatch remediation plan

This document tracks the production-readiness work identified in the repository review. Items are ordered by user-visible impact and data safety.

## Milestone 1 — Correct reminder behavior

- [x] Route stretch visits to stretch-specific dialogue and actions.
- [x] Respect the **Random Check-ins & Stretches** setting when choosing automatic visits.
- [x] Schedule water and break reminders independently using their configured intervals.
- [x] Persist the most recent hydration and break timestamps so reminders survive restarts.
- [x] Hide an already visible pet when the companion is disabled.
- [x] Remove the tray chat animation race that could show chat and a visit bubble together.

## Milestone 2 — Protect settings and user data

- [x] Validate every settings value in the main process, not only in the Settings UI.
- [ ] Make config writes atomic and retain a recoverable backup.
- [ ] Do not save API keys in plaintext when OS encryption is unavailable.
- [ ] Return only a key-presence indicator to the Settings renderer; keep decrypted keys in the main process.
- [ ] Store summon-button placement relative to a display ID rather than as only absolute coordinates.

## Milestone 3 — Engineering baseline

- [ ] Reconcile `package.json`, `package-lock.json`, and the selected packaging tool.
- [ ] Add unit tests for streak rollovers, quiet hours, setting validation, and reminder selection.
- [ ] Add linting, formatting, and CI checks for clean installation, tests, and packaging.
- [ ] Commit source and assets intentionally; ignore generated package output and publish it as release artifacts.
- [ ] Add a license only after confirming rights to the character art and branding.

## Milestone 4 — Product work

- [ ] Focus-session/Pomodoro mode with durable timers and session statistics.
- [ ] Historical wellness records, charts, CSV/JSON export, and user-controlled retention.
- [ ] Interactive mood-option controls with local mood history.
- [ ] Per-protocol reminder settings rather than one global check-in switch.
- [ ] Reduced-motion, keyboard-navigation, high-contrast, and font-size accessibility settings.
- [ ] Signed, versioned release builds and a deployment-safe website download link.

## Acceptance criteria

An implementation is complete only when its behavior is exercised through a test or a documented manual verification path, is reflected accurately in the README/website, and does not weaken the Electron security boundary.
