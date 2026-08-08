# Architecture

## Request flow

```text
Frontend (public/)
  ↓
POST /api/images/inspect or /api/images/process
  ↓
src/routes/image.routes.js
  ↓
Multer memoryStorage
  ↓
validate-image.middleware.js
  ↓
image-validation.service.js
  ├─ Magic Number / file-type
  └─ Sharp metadata / pixel limits
  ↓
image.controller.js
  ↓
image-processing.service.js
  ↓
Sharp compression / conversion
  ↓
storage/output/
  ↓
/downloads/<filename>
```

## Folder responsibilities

- `src/config`: shared upload/image policies.
- `src/routes`: URL to middleware/controller mapping only.
- `src/middlewares`: request validation and centralized errors.
- `src/controllers`: HTTP request/response orchestration.
- `src/services`: image validation and processing business logic.
- `src/errors`: application error types.
- `public`: browser UI.
- `storage`: runtime-generated files; not source code.
- `tests/fixtures`: test images.
- `docs`: project notes and architecture documentation.
