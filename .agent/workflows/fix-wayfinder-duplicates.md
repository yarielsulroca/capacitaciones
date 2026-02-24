---
description: Fix duplicate queryParams imports after running php artisan wayfinder:generate
---

# Fix Wayfinder Duplicate Imports

Run this workflow whenever you see the Vite error:

> `Identifier 'queryParams' has already been declared`

## Steps

// turbo

1. Run the fix script from the project root:

```
powershell -ExecutionPolicy Bypass -File fix-wayfinder-duplicates.ps1
```

The script will:

- Scan all `.ts` files in `resources/js/routes/`
- Remove any duplicate `import { queryParams ... }` lines
- Report which files were fixed

2. Restart the Vite dev server if it's running:

```
composer run dev
```
