# Definitions

Spans - a span is a unit of work with a clear beginning and end used to provide context for log records.
LogRecords - individual measurement taken during a span used to capture a measurement for each iteration. Each value is preserved.
Metrics - individual measurement taken during a span used to capture a metric for each iteration. One aggregated value is preserved.
PostHog's row-per-event model - every captured event is one row in a single ClickHouse table called `events`, with metadata flattened into a JSON property bag on that row.
HogQL - a SQL-like query language for ClickHouse, used to query the `events` table.
ClickHouse - a columnar database optimized for OLAP workloads.
OLAP - On-Line Analytical Processing - analyze large volumes of data in real-time.
Five-level OTEL hierarchy - OTEL data model has five nested levels for any signal.
OTEL Resource - Things true for the entire process lifetime. Ex: CPU model name, OS version, Pipeline Run id.
OTEL InstrumentationScope - The code that emits OTEL data - name + version. Ex: `effection.benchmark` at `0.1.0`.
DataPoint - Per-measurement labels. Ex: `benchmark.scenario = "recursion"`, `benchmark.iteration = 7`, `benchmark.phase = "measurement"`
Examplar - A raw sample preserved alongside an aggregated DataPoint (e.g., one actual duration value attached to a Histogram bucket so you can drill down from "P99 spiked" to a specific trace)
OTEL Timseries - A timeseries is a full set of attributes attached to a metric.
Cardinality - The number of unique attribute values for a given metric. Low good, high bad.

# Architecture

## OTEL data model

OTEL data model has five nested levels for any signal. Every Span / Metric DataPoint / LogRecord that goes out on the wire is wrapped in this hierarchy. 

```
Resource                               ← describes the PROCESS (invariant for its lifetime)
└── InstrumentationScope               ← describes the LIBRARY emitting the data
    └── Metric  /  Span  /  LogRecord  ← describes the MEASUREMENT KIND
        └── DataPoint                  ← describes ONE OBSERVATION
            └── Exemplar               ← a sample raw value attached to an aggregated DataPoint
```

Every unique combination of attribute values is a *separate* timeseries that the backend must store, index, and keep alive forever (or until retention drops it). Two `record()` calls land in the same timeseries only if they share *every* attribute value.

### Avoid the cardinality trap

Since every unique combination of attribute values is a separate timeseries, adding attributes that have a high cardinality will grow the number of timeseries with every unique value. `benchmark.scenario="recursion"` has low cardinality because the set of scenario names is small and fixed — every measurement reuses one of a handful of values, so no new timeseries is created. `commit.sha` has high cardinality because every commit produces a new value, and every new value creates a new timeseries.

Avoid putting high-cardinality attributes on **DataPoints**, where they multiply timeseries count. Put them on **Resource** instead — Resource attributes describe the producing process, not the timeseries identity, so commit SHA, runner ID, and pipeline run ID stay queryable without inflating storage.

## PostHog data model

1. One write = one row. Every `/capture` POST creates exactly one row.
2. Aggregation happens at query time, not write time.
3. All metadata lives inside `properties`, a flat JSON-ish map.
