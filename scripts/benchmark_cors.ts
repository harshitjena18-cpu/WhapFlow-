
/**
 * scripts/benchmark_cors.ts
 *
 * Benchmarks string equality vs regex testing for CORS origin validation.
 */

const APP_DOMAIN = "https://app.whapflow.com";
const API_DOMAIN = "https://api.whapflow.com";
const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function benchmarkRegex(origin: string, iterations: number) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        LOCALHOST_REGEX.test(origin);
    }
    return performance.now() - start;
}

function benchmarkString(origin: string, iterations: number) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const _match = origin === APP_DOMAIN || origin === API_DOMAIN;
    }
    return performance.now() - start;
}

function runBenchmark() {
    const iterations = 1000000;
    const origin = APP_DOMAIN;

    console.log(`⚡ Bolt CORS Benchmark: String Equality vs Regex (N=${iterations.toLocaleString()})`);
    console.log(`Origin: ${origin}\n`);

    const regexTime = benchmarkRegex(origin, iterations);
    console.log(`  - Regex Test:      ${regexTime.toFixed(2)}ms`);

    const stringTime = benchmarkString(origin, iterations);
    console.log(`  - String Equality: ${stringTime.toFixed(2)}ms`);

    console.log("\n--- Comparison ---");
    console.log(`Speedup: ${(regexTime / stringTime).toFixed(2)}x`);
    console.log(`Latency Reduction: ${(regexTime - stringTime).toFixed(2)}ms`);
}

runBenchmark();
