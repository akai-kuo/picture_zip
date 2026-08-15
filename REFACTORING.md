# Project Structure Refactoring

This package was reorganized without changing the intended product behavior.

## Main changes

1. Moved all backend source code under `src/`.
2. Moved `app.js` and `server.js` into `src/` and updated npm scripts.
3. Removed the obsolete `routes/images.js` Formidable router.
4. Removed the obsolete root `compress.js` implementation and old `test.js` that depended on it.
5. Removed empty `backend/middlewares/upload.middleware.js`.
6. Removed the obsolete `uploads/` directory because Multer now uses `memoryStorage()`.
7. Moved runtime output to `storage/output/`; added `storage/temp/` for future disk-storage use.
8. Moved the sample image to `tests/fixtures/sample.jpg`.
9. Moved non-root documentation into `docs/`.
10. Added `src/config/image.config.js` so upload size, pixel limits, output formats, and default quality live in one place.
11. Updated `.env.example`, `.gitignore`, `package.json`, and `package-lock.json` paths/dependencies.
12. Removed unused `formidable` dependency.

## Active routes

- `GET /health`
- `GET /api/images/health`
- `POST /api/images/inspect`
- `POST /api/images/process`

## Run

```bash
npm install
npm run dev
```
