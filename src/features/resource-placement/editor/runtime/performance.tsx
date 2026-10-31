import React, { Profiler, useLayoutEffect, useEffect } from 'react';

const STORAGE_KEY = 'vimo.lowcode.performance';
const SAMPLE_LIMIT = 2000;
const enabled = (() => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
})();

type RenderSample = { phase: string; actualDuration: number; baseDuration: number; commitTime: number };
type TaskSample = { startTime: number; duration: number };
let renders: RenderSample[] = [];
let longTasks: TaskSample[] = [];
const emptyCounters = () => ({
  shell: 0,
  content: 0,
  panelMounts: 0,
  monacoMounts: 0,
  codeSnapshots: 0,
  visibility: 0,
  visibilityEvaluations: 0
});
let counters = emptyCounters();
let startedAt = enabled ? performance.now() : 0;
let dropped = { renders: 0, longTasks: 0 };
let observer: PerformanceObserver | undefined;

const append = <T,>(samples: T[], sample: T, kind: keyof typeof dropped) => {
  if (samples.length >= SAMPLE_LIMIT) {
    samples.shift();
    dropped[kind]++;
  }
  samples.push(sample);
};
const collectTasks = (entries: PerformanceEntry[]) => {
  entries
    .filter((entry) => entry.startTime >= startedAt)
    .forEach(({ startTime, duration }) => {
      append(longTasks, { startTime, duration }, 'longTasks');
    });
};

const api = {
  reset: () => {
    observer?.takeRecords();
    startedAt = performance.now();
    renders = [];
    longTasks = [];
    counters = emptyCounters();
    dropped = { renders: 0, longTasks: 0 };
  },
  snapshot: () => {
    if (observer) {
      collectTasks(observer.takeRecords());
    }
    return {
      startedAt,
      endedAt: performance.now(),
      counters: { ...counters },
      renders: [...renders],
      longTasks: [...longTasks],
      dropped: { ...dropped },
      longTaskSupported:
        typeof PerformanceObserver !== 'undefined' &&
        PerformanceObserver.supportedEntryTypes?.includes('longtask'),
      cumulativeBlockingMs: longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)
    };
  }
};

declare global {
  interface Window {
    __VIMO_LOWCODE_PERF__?: typeof api;
  }
}

export const recordLifecycleMetric = (
  kind: 'panelMounts' | 'monacoMounts' | 'codeSnapshots' | 'visibilityEvaluations'
) => {
  if (enabled) {
    counters[kind]++;
  }
};

export const useRenderMetric = (kind: keyof typeof counters) => {
  // Count committed renders, including subscription updates; aborted renders are excluded.
  useLayoutEffect(() => {
    if (enabled) {
      counters[kind]++;
    }
  });
};

const onRender: React.ProfilerOnRenderCallback = (
  _id,
  phase,
  actualDuration,
  baseDuration,
  _start,
  commitTime
) => {
  append(renders, { phase, actualDuration, baseDuration, commitTime }, 'renders');
};

export const CanvasProfiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    window.__VIMO_LOWCODE_PERF__ = api;
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('longtask')
    ) {
      observer = new PerformanceObserver((list) => collectTasks(list.getEntries()));
      observer.observe({ type: 'longtask', buffered: true });
    }
    return () => {
      observer?.disconnect();
      observer = undefined;
      delete window.__VIMO_LOWCODE_PERF__;
    };
  }, []);
  return enabled ? (
    <Profiler id="lowcode-canvas" onRender={onRender}>
      {children}
    </Profiler>
  ) : (
    <>{children}</>
  );
};
