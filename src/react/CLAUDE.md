# React entry guidance

This folder is the optional `unified-error-handling/react` surface. React stays an optional peer and must remain external in both builds. Keep one implementation for each public symbol, update the barrel with intentional exports, and preserve error-boundary fallback behavior. Verify declaration paths and the 12 kB React size budget after changes. Last context pass: 2026-10-20; next routine pass: 2026-11-19.
