// Global Jest setup — runs once per test file before any test code.
// Mirrors the BigInt → Number JSON coercion applied in src/main.ts so that
// integration/e2e tests (which build the Nest app straight from AppModule,
// bypassing main.ts) see the same response serialization real requests get.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
