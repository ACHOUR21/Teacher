declare module 'prom-client' {
  export const register: {
    metrics(): Promise<string>;
    contentType: string;
    clear(): void;
    registerMetric(metric: any): void;
  };
  export class Counter<T extends string = string> {
    constructor(config: { name: string; help: string; labelNames?: T[]; registers?: any[] });
    inc(labels?: Partial<Record<T, string | number>>, value?: number): void;
    inc(value?: number): void;
  }
  export class Histogram<T extends string = string> {
    constructor(config: { name: string; help: string; labelNames?: T[]; buckets?: number[]; registers?: any[] });
    observe(labels: Partial<Record<T, string | number>>, value: number): void;
    observe(value: number): void;
    startTimer(labels?: Partial<Record<T, string | number>>): (labels?: Partial<Record<T, string | number>>) => number;
  }
  export class Gauge<T extends string = string> {
    constructor(config: { name: string; help: string; labelNames?: T[]; registers?: any[] });
    set(labels: Partial<Record<T, string | number>>, value: number): void;
    set(value: number): void;
    inc(labels?: Partial<Record<T, string | number>>, value?: number): void;
    dec(labels?: Partial<Record<T, string | number>>, value?: number): void;
  }
  export class Registry {
    metrics(): Promise<string>;
    contentType: string;
    clear(): void;
    registerMetric(metric: any): void;
  }
  export function collectDefaultMetrics(config?: { register?: any; prefix?: string }): void;
}
