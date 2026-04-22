const { performance } = require('perf_hooks');

const hmac = "2f57b897931340b073e514f7d23d8c47f7d9834823297a747970868f7634629a"; // Example HMAC hex string

function manualConversion(hmac) {
    const hmacBytes = new Uint8Array(hmac.length / 2);
    for (let i = 0; i < hmac.length; i += 2) {
        hmacBytes[i / 2] = parseInt(hmac.substring(i, i + 2), 16);
    }
    return hmacBytes;
}

function bufferConversion(hmac) {
    return Buffer.from(hmac, 'hex');
}

function runBenchmark(fn, label, iterations = 1000000) {
    // Warm up
    for (let i = 0; i < 10000; i++) fn(hmac);

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn(hmac);
    }
    const end = performance.now();
    const duration = end - start;
    console.log(`${label}: ${duration.toFixed(2)}ms for ${iterations} iterations`);
    return duration;
}

console.log("Starting HMAC Conversion Benchmark...");
const manualTime = runBenchmark(manualConversion, "Manual Loop");
const bufferTime = runBenchmark(bufferConversion, "Buffer.from");

const improvement = (manualTime / bufferTime).toFixed(2);
console.log(`\nImprovement: ${improvement}x faster`);
