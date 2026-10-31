import React, { Profiler, useLayoutEffect, useEffect } from 'react';

const STORAGE_KEY = 'vimo.lowcode.performance';
const SAMPLE_LIMIT = 2000;
const enabled = (/* 读取本地性能采样开关，存储不可访问时关闭采样。 */ () => {
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
/** 创建全部归零的生命周期与渲染计数器。 */
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

/** 追加性能样本，达到上限后淘汰最旧样本并记录丢弃数。 */
const append = <T,>(samples: T[], sample: T, kind: keyof typeof dropped) => {
  if (samples.length >= SAMPLE_LIMIT) {
    samples.shift();
    dropped[kind]++;
  }
  samples.push(sample);
};
/** 收集本轮采样开始后的长任务。 */
const collectTasks = (entries: PerformanceEntry[]) => {
  entries
    .filter(/* 排除采样开始前的任务记录。 */ (entry) => entry.startTime >= startedAt)
    .forEach(/* 保存长任务的开始时间和耗时。 */ ({ startTime, duration }) => {
      append(longTasks, { startTime, duration }, 'longTasks');
    });
};

const api = {
  reset: /* 清空采样结果及计数，开始新的统计窗口。 */ () => {
    observer?.takeRecords();
    startedAt = performance.now();
    renders = [];
    longTasks = [];
    counters = emptyCounters();
    dropped = { renders: 0, longTasks: 0 };
  },
  snapshot: /* 合并待取任务并返回当前性能快照。 */ () => {
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
      cumulativeBlockingMs: longTasks.reduce(/* 累计每个长任务超过 50 毫秒的阻塞时间。 */ (sum, task) => sum + Math.max(0, task.duration - 50), 0)
    };
  }
};

declare global {
  interface Window {
    __VIMO_LOWCODE_PERF__?: typeof api;
  }
}

/** 仅在启用采样时记录指定生命周期事件。 */
export const recordLifecycleMetric = (
  kind: 'panelMounts' | 'monacoMounts' | 'codeSnapshots' | 'visibilityEvaluations'
) => {
  if (enabled) {
    counters[kind]++;
  }
};

/** 在布局提交阶段计数，排除被 React 放弃的渲染。 */
export const useRenderMetric = (kind: keyof typeof counters) => {
  // 仅统计已提交渲染，包含订阅触发的更新，不计被 React 放弃的渲染。
  useLayoutEffect(/* 提交完成后增加对应渲染计数。 */ () => {
    if (enabled) {
      counters[kind]++;
    }
  });
};

/** 保存 React Profiler 提供的本次提交耗时样本。 */
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

/** 为画布提供可选性能分析边界，并管理长任务观察器。 */
export const CanvasProfiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(/* 启用时注册调试 API 和长任务监听，卸载时清理。 */ () => {
    if (!enabled) {
      return;
    }
    window.__VIMO_LOWCODE_PERF__ = api;
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('longtask')
    ) {
      observer = new PerformanceObserver(/* 将观察器返回的任务条目交给采样收集器。 */ (list) => collectTasks(list.getEntries()));
      observer.observe({ type: 'longtask', buffered: true });
    }
    return /* 释放长任务观察器并移除窗口上的性能接口。 */ () => {
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
