# Image API

## GET /health
Application health check.

## GET /api/images/health
Confirms the new image router is mounted.

## POST /api/images/inspect
Validates one image without generating an output file.

`multipart/form-data`:
- `image`: JPEG, PNG, WebP, or AVIF file.

## POST /api/images/process
Validates, compresses/converts, saves, and returns an output URL.

`multipart/form-data`:
- `image`: required image file.
- `format`: optional; `jpeg`, `png`, `webp`, `avif`. Default `webp`.
- `quality`: optional integer 1–100. Default `80`.
- `maxWidth`: optional integer 1–12000.

Example:

```bash
curl.exe -X POST http://localhost:3000/api/images/process -F "image=@./tests/fixtures/sample.jpg" -F "format=webp" -F "quality=80"
```
