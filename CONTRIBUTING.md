# Contributing

Thanks for helping. The most wanted contributions:

1. **Yarn palettes** — real yarn-line shade cards as
   `{ code, name, rgb }` arrays under `palettes/`. Please note the
   source of the color data in the file header.
2. **Instruction formats** — other written-instruction conventions
   (C2C, filet, in-the-round) as additional exporters in `src/`.
3. **Bug reports** — include a small test image (or its pixel
   dimensions), the options you used, and the row where the output
   looks wrong.

Run tests before sending a PR:

```bash
npm test
```

Keep functions pure and exported individually so they stay testable,
and keep the zero-dependency rule for `src/`.
