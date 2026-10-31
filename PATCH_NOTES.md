# Windows test portability patch

Apply this patch by extracting its contents into the root of the existing
`principal-agentic-engineering-harness` project and replacing the two files
under `tests/`.

## Changes

- `tests/runtime-config.test.ts`: compares the workspace root with
  `path.resolve('/tmp/project')`, so the expected value follows the host OS.
- `tests/workspace-guard.test.ts`: compares canonical paths using `realpath()`
  on both expected and actual paths. This handles Windows 8.3 short-name versus
  long-name path representations.
- The directory symlink test uses a Windows junction on Windows. If the current
  Windows environment explicitly disallows junction/symlink creation, only that
  symlink-specific test is skipped with a clear reason. Other workspace guard
  security tests continue to run.

No production source code or security validation has been weakened.

## Apply

Extract into `D:\\principal-agentic-engineering-harness` (or the actual project
root), replacing files when prompted. Then run:

```powershell
npm run check
```
