
Deno.test("Sanity Check", () => {
  if (1 !== 1) {
    throw new Error("Math is broken");
  }
});
