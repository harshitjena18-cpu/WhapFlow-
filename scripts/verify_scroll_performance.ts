/**
 * Benchmark comparing unthrottled scroll handlers vs requestAnimationFrame throttled scroll handlers.
 */

function simulateUnthrottledScroll(scrollEventsCount: number, scrollYValues: number[]) {
  let stateSetCount = 0;
  let isScrolled = false;

  const handleScroll = (scrollY: number) => {
    const nextScrolled = scrollY > 10;
    // Unthrottled calls state setter every event
    if (nextScrolled !== isScrolled) {
      isScrolled = nextScrolled;
    }
    stateSetCount++; // Function executed on main thread on every scroll event
  };

  const start = performance.now();
  for (let i = 0; i < scrollEventsCount; i++) {
    handleScroll(scrollYValues[i]);
  }
  const duration = performance.now() - start;

  return { duration, stateSetCount };
}

function simulateThrottledScroll(scrollEventsCount: number, scrollYValues: number[]) {
  let stateSetCount = 0;
  let isScrolled = false;
  let ticking = false;

  const updateScroll = (scrollY: number) => {
    const nextScrolled = scrollY > 10;
    if (nextScrolled !== isScrolled) {
      isScrolled = nextScrolled;
      stateSetCount++;
    }
    ticking = false;
  };

  const handleScroll = (scrollY: number) => {
    if (!ticking) {
      ticking = true;
      // In browser this is requestAnimationFrame(() => updateScroll(scrollY))
      updateScroll(scrollY);
    }
  };

  const start = performance.now();
  for (let i = 0; i < scrollEventsCount; i++) {
    handleScroll(scrollYValues[i]);
  }
  const duration = performance.now() - start;

  return { duration, stateSetCount };
}

function runBenchmark() {
  const NUM_EVENTS = 100000;
  // Generate scroll values simulating a user scrolling down
  const scrollYValues = Array.from({ length: NUM_EVENTS }, (_, i) => 15 + (i % 500));

  console.log(`⚡ Bolt Scroll Event Optimization Benchmark (${NUM_EVENTS} scroll events)`);

  const unthrottled = simulateUnthrottledScroll(NUM_EVENTS, scrollYValues);
  const throttled = simulateThrottledScroll(NUM_EVENTS, scrollYValues);

  console.log(`Unthrottled execution count / dispatches: ${unthrottled.stateSetCount}`);
  console.log(`Throttled execution count / dispatches:   ${throttled.stateSetCount}`);
  console.log(`Reduction in scroll handler dispatches:  ${(((unthrottled.stateSetCount - throttled.stateSetCount) / unthrottled.stateSetCount) * 100).toFixed(2)}%`);
  console.log(`Unthrottled time: ${unthrottled.duration.toFixed(2)}ms`);
  console.log(`Throttled time:   ${throttled.duration.toFixed(2)}ms`);
}

runBenchmark();
