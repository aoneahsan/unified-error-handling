# Store guidance

The store is a module singleton with one active adapter. Preserve bounded breadcrumbs, in-memory offline queuing, subscription cleanup, and `beforeSend` cancellation. Do not describe the queue as persistent or claim multi-adapter delivery. Browser listeners must be guarded and removable. Last context pass: 2026-10-20; next routine pass: 2026-11-19.
