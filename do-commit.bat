@echo off
cd /d C:\Users\keith\MoneyGeneratorApp

echo === Staging files ===
git add .github/copilot-instructions.md
git add web/src/styles/designSystem.css
git add web/src/index.css
git add web/src/design-system.css
git add RELEASE_NOTES_V1.3.1.md
git add web/dist/bundle-budget-report.json 2>nul

echo === Status after staging ===
git status

echo === Committing ===
git commit -m "chore: release prep -- design tokens, copilot instructions, build baseline" -m "- Add .github/copilot-instructions.md for future Copilot sessions" -m "- Remove unused Inter font from Google Fonts request (index.css)" -m "- Drop 12 dead CSS custom properties from designSystem.css" -m "  (--color-charcoal-700/800, --color-gold-600, --color-dark-bg-primary," -m "   --color-dark-bg-secondary, --color-dark-text-primary/secondary/tertiary," -m "   --color-dark-border-light, --leading-snug, --tracking-normal, --space-7)" -m "- Tombstone unreferenced design-system.css (not imported anywhere)" -m "- Fix npm.cmd artifact in RELEASE_NOTES_V1.3.1.md" -m "- MapLibre audit: keep as-is -- triple-deferred, zero cost for non-map users" -m "- index.html metadata: already clean, no changes needed" -m "- Budget build baseline: all budgets pass, entry CSS 31 kB" -m "" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo === Pushing ===
git push || git push --set-upstream origin HEAD

echo === Done ===
git --no-pager log -1 --oneline
