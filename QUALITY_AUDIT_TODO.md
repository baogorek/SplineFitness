# Quality Audit Remediation Tracker

This file tracks the August 2026 quality audit. Work is performed in numerical
order. An item is complete only after its implementation and relevant focused
verification pass.

## Audit items

- [x] 1. Preserve a retryable completed workout until its cloud save succeeds.
- [x] 2. Make post-completion sign-in save the workout that was just completed.
- [x] 3. Validate imported Circuit configurations without allowing runtime crashes.
- [x] 4. Resolve or explicitly triage production dependency vulnerabilities.
- [x] 5. Give Interval and SIT complete History calendar, totals, and detail support.
- [x] 6. Distinguish History load failures from a genuinely empty workout history.
- [x] 7. Persist the final Interval set note to workout history.
- [x] 8. Display the configured Circuit equipment value instead of `10 lbs`.
- [x] 9. Persist Circuit duration preferences without remounting away setup edits.
- [x] 10. Round-trip per-exercise Circuit durations through saved configurations.
- [x] 11. Make Circuit and Freeform local-storage handling as defensive as other modes.
- [x] 12. Reconcile signed-in Frontier local fallbacks with cloud data and deletes.
- [x] 13. Prevent mismatched Frontier import metrics from corrupting typed values.
- [x] 14. Remove stale navigation-guard history entries and align activation by mode.
- [x] 15. Correct the audited accessible-name, dialog, and nested-control defects.
- [x] 16. Make blog dates timezone-safe and remove duplicate post H1 headings.
- [x] 17. Make guest-data wording consistent between Terms, Privacy, and the app.
- [x] 18. Add automated regression coverage for the high-risk audited behavior.

## Additional observations

- [x] Review the Interval countdown's extra lead second for intentionality.
- [x] Clear or suppress the unusable resume checkpoint after an early-ended VO2 test.

## Final verification

- [x] `npm run lint`
- [x] Automated test suite
- [x] `npm run build`
- [x] `npm audit --omit=dev`
- [x] Working-tree review
