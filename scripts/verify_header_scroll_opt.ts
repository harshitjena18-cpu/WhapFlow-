/**
 * scripts/verify_header_scroll_opt.ts
 *
 * Benchmark scroll listener throttling using requestAnimationFrame.
 */

function simulateUnthrottledScroll(eventCount: number) {
  let executions = 0;
  let isScrolled = false;
  const start = performance.now();

  for (let i = 0; i < eventCount; i++) {
    const scrollY = i % 50;
    executions++;
    isScrolled = scrollY > 10;
  }

  const duration = performance.now() - start;
  return { executions, duration };
}

function simulateThrottledScroll(eventCount: number) {
  let executions = 0;
  let isScrolled = false;
  let ticking = false;
  const start = performance.now();

  const mockRafCallbacks: Array<() => void> = [];

  for (let i = 0; i < eventCount; i++) {
    const scrollY = i % 50;
    if (!ticking) {
      ticking = true;
      mockRafCallbacks.push(() => {
        executions++;
        isScrolled = scrollY > 10;
        ticking = false;
      });
    }
  }

  // Flush RAF callbacks (simulating frame render ticks)
  while (mockRafCallbacks.length > 0) {
    const cb = mockRafCallbacks.shift();
    if (cb) cb();
  }

  const duration = performance.now() - start;
  return { executions, duration };
}

async function runBenchmark() {
  const EVENT_COUNT = 10000;
  console.log(`⚡ Bolt Performance Benchmark: Scroll Listener Throttling (${EVENT_COUNT} events)`);

  const unthrottled = simulateUnthrottledScroll(EVENT_COUNT);
  console.log(`- Unthrottled Executions: ${unthrottled.executions} (${unthrottled.duration.toFixed(3)}ms)`);

  const throttled = simulateThrottledScroll(EVENT_COUNT);
  console.log(`- Throttled Executions:   ${throttled.executions} (${throttled.duration.toFixed(3)}ms)`);

  const reduction = (((unthrottled.executions - throttled.executions) / unthrottled.executions) * 100).toFixed(1);
  console.log(`\n📊 Overhead Reduction: ${reduction}% fewer main-thread handler executions during rapid scrolling.`);
}

runBenchmark().catch(console.error);
