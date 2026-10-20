# Adapter guidance

Adapters translate the common error contract to one consumer-installed SDK. Load SDKs with dynamic imports, preserve the original import failure as `cause`, validate required configuration, and never bundle vendor SDKs. `useAdapter()` selects one active adapter. Add or remove adapters through the adapter barrel, root exports, README, docs, examples, and changelog together. The Firebase issue in `docs/REPORTED-ISSUES.md` remains open until a supported target is chosen. Last context pass: 2026-10-20; next routine pass: 2026-11-19.
