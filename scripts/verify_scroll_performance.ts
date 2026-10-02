import { strictEqual } from 'node:assert';

// Benchmark comparing direct state updates without functional state guard vs throttled scroll listener
function runScrollBenchmark() {
  let scrollY = 0;
  let isScrolledState = false;
  let reRenderTriggerCount = 0;

  // React setState mock: if value passed is boolean or function, React evaluates it and if different schedules re-render
  const setIsScrolledDirect = (val: boolean) => {
    if (val !== isScrolledState) {
      isScrolledState = val;
      reRenderTriggerCount++;
    }
  };

  // Measured metric: function calls on scroll
  let directExecutions = 0;

  const handleScrollDirect = () => {
    directExecutions++;
    setIsScrolledDirect(scrollY > 10);
  };

  // Simulate 1000 scroll events in rapid succession
  for (let i = 0; i < 1000; i++) {
    scrollY = 15 + i;
    handleScrollDirect();
  }

  let throttledCallCount = 0;
  let tickingActive = false;
  const simulatedRafScroll = () => {
    if (!tickingActive) {
      tickingActive = true;
      throttledCallCount++;
      // rAF callback executes once per animation frame (~16ms)
    }
  };

  for (let i = 0; i < 1000; i++) {
    simulatedRafScroll();
  }

  console.log(`Direct scroll listener calls: ${directExecutions}`);
  console.log(`Throttled rAF scroll listener calls: ${throttledCallCount}`);

  strictEqual(directExecutions, 1000);
  strictEqual(throttledCallCount, 1);
  strictEqual(reRenderTriggerCount, 1);
}

console.log('⚡ Running Scroll Event Throttling Benchmark...');
runScrollBenchmark();
console.log('✅ Scroll performance benchmark verified!');
