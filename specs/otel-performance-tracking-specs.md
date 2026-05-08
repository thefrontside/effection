# Definitions

## OTEL signals

- **Span** — A unit of work with a clear beginning and end. Provides context for the LogRecords and Metrics emitted within it.
- **LogRecord** — An individual measurement emitted during a span, used to capture a value for each iteration. Every value is preserved.
- **Metric** — An aggregated measurement emitted during a span, used to capture a single rolled-up value across iterations. Only the aggregate is preserved.

## OTEL data model

- **Five-level OTEL hierarchy** — Every OTEL signal is wrapped in five nested levels: Resource → InstrumentationScope → Metric/Span/LogRecord → DataPoint → Exemplar.
- **Resource** — Attributes that are invariant for the producing process's lifetime. Ex: CPU model name, OS version, pipeline run ID.
- **InstrumentationScope** — The name and version of the code that emitted the data. Ex: `effection.benchmark` at `0.1.0`.
- **DataPoint** — Per-measurement labels attached to a single observation. Ex: `benchmark.scenario = "recursion"`, `benchmark.iteration = 7`, `benchmark.phase = "measurement"`.
- **Exemplar** — A raw sample preserved alongside an aggregated DataPoint (e.g., one actual duration value attached to a Histogram bucket, so you can drill from "P99 spiked" back to a specific trace).
- **Timeseries** — A unique combination of attribute values attached to a metric. Two measurements share a timeseries only if every attribute value matches.
- **Cardinality** — The number of unique values an attribute can take. Low cardinality is cheap; high cardinality multiplies timeseries count when placed on DataPoints.

## OTEL transport

- **Collector** — Receives OTEL data from instrumented applications via OTLP, processes it through a `receivers → processors → exporters` pipeline (batching, attribute transforms, format conversion), and exports it to one or more backends.
- **OTLP** — OpenTelemetry Protocol. The wire format and transport (Protocol Buffers over gRPC or HTTP) used to ship OTEL data between components.
- **Cumulative temporality** — Each metric DataPoint reports the value accumulated since a fixed start timestamp (typically process start). Successive points share the same start time; consumers compute rates by subtracting consecutive points.
- **Delta temporality** — Each metric DataPoint reports only the value for the just-ended export interval. Each point has its own start/end timestamps. Required for PostHog's row-per-event model, where each event must stand alone.

## PostHog backend

- **PostHog row-per-event model** — Every captured event is one row in a single ClickHouse table called `events`, with metadata flattened into a JSON property bag on that row.
- **ClickHouse** — A columnar database optimized for OLAP workloads. PostHog's underlying storage.
- **OLAP** — Online Analytical Processing. A workload pattern focused on aggregating large volumes of data in real time.
- **HogQL** — A SQL-like query language over ClickHouse, used to query the `events` table.

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

## Rejected alternatives

### SpanMetrics Connector

The benefit of the SpanMetrics connector is that it allows you to convert OTEL Span data into OTEL Metric DataPoints without doign extra work. 

For example,
```
Span: effection.benchmark.scenario
  start: 14:32:01.142
  end:   14:32:05.387        → duration = 4245 ms
  attrs: { benchmark.scenario: "recursion" }
```

The SpanMetrics Connector reads spans flowing through the Collector, computes `end - start`, and emits a Histogram metric DataPoint into the metrics pipeline — without any code in your application calling `histogram.record()`.

It's convenient but it was rejected in research because, 

1. It's default flush interval is 60-seconds which maybe too quick for an Effection benchmark running in CI. The collector will shutdown before recording any data.
2. Connector's bucket boundaries are designed for HTTP latencies in millisecond to second range. For Effection benchmarks, we'll need nanosecond to microsecond level resolution.
3. PostHog expected Delta Temporality, but the SpanMetrics Connector uses Cumulative Temporality. Conversion increases complexity.
4. SpanMetrics requires a Collector sidecar in every CI runner.

## Examplars to connect metrics to spans

Examples exist because because Histograms throw away raw samples in exchange for bucket counts. Examplars provide a represenative sample after aggregation.

We're going to record timings using LogRecords with every sample preserved verbatim - we're not going to aggregate as SDK time. We're also not going to record fine-grained spans inside scenarios, at least not for the foreesable future, which means that we won't have anything to drill into. 

We might reconsider this if we end up having spans with >10k iterations.
