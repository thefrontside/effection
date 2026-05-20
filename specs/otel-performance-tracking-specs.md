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
- **Semantic conventions (semconv)** — OTEL's catalog of standardized names for attributes, metrics, and span operations across common domains (HTTP, database, test, CICD). Following semconv makes signals portable across tools. Project-specific data uses a reverse-domain prefix (`effection.benchmark.*`); standard attributes (`test.case.name`, `vcs.ref.head.revision`, `host.cpu.model.name`) use semconv directly.

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

# Scope

The Effection benchmark suite is bounded to **20-50 scenarios maximum, total across all benchmark types**. This is a hard ceiling on the design surface. Many "at scale" concerns that the OTEL and PostHog ecosystems raise — ClickHouse index cardinality, timeseries explosion, batch ceiling thresholds — apply at thousands or millions of distinct metric streams and are functionally moot at our scale. Where a design choice has both a "convention" justification and an "at scale" justification, this spec leans on convention; scale concerns are noted but de-emphasized.

# Architecture

## OTEL hierarchy

OTEL data model has five nested levels for any signal. Every Span / Metric DataPoint / LogRecord that goes out on the wire is wrapped in this hierarchy. 

```
Resource                               ← describes the PROCESS (invariant for its lifetime)
└── InstrumentationScope               ← describes the LIBRARY emitting the data
    └── Metric  /  Span  /  LogRecord  ← describes the MEASUREMENT KIND
        └── DataPoint                  ← describes ONE OBSERVATION
            └── Exemplar               ← a sample raw value attached to an aggregated DataPoint
```

Every unique combination of attribute values is a *separate* timeseries that the backend must store, index, and keep alive forever (or until retention drops it). Two `record()` calls land in the same timeseries only if they share *every* attribute value.

## PostHog data model

1. One write = one row. Every `/capture` POST creates exactly one row.
2. Aggregation happens at query time, not write time.
3. All metadata lives inside `properties`, a flat JSON-ish map.

## Data flow

Benchmark code instruments against `@opentelemetry/api` only. The OTEL SDK serializes signals into OTLP and ships them to a Collector running as a sidecar container. The Collector's `posthog_capture` exporter is the only component that knows what PostHog is — it translates each OTLP record into a flat `/capture` event and POSTs to PostHog. PostHog stores the event as one row in the ClickHouse `events` table, queryable via HogQL.

```
┌─ Benchmark process (Deno) ────────────────────────────────────────────┐
│                                                                        │
│   Benchmark code                                                       │
│       │                                                                │
│       │  tracer.startSpan() · logger.emit() · counter.add()            │
│       ▼                                                                │
│   @opentelemetry/api                                                   │
│       │                                                                │
│       │  Spans · LogRecords · Metrics                                  │
│       ▼                                                                │
│   OTEL SDK  (BatchSpanProcessor · BatchLogRecordProcessor ·            │
│              PeriodicExportingMetricReader)                            │
│       │                                                                │
│       │  Serialize to OTLP (Protocol Buffers)                          │
│       ▼                                                                │
│   OTLP/HTTP exporter                                                   │
│                                                                        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               │  POST → http://localhost:4318/v1/{traces,logs,metrics}
                               ▼
┌─ Collector (GitHub Actions services: container) ──────────────────────┐
│                                                                        │
│   receivers: [otlp]                                                    │
│       │                                                                │
│       ▼                                                                │
│   processors: [batch, resource, transform]                             │
│       │                                                                │
│       ▼                                                                │
│   exporters: [posthog_capture]                                         │
│       │                                                                │
│       │  One OTLP DataPoint / Span / LogRecord → one /capture event    │
│       │  Flatten five-level hierarchy → otel_resource_*                │
│       │                                   otel_scope_*                 │
│       │                                   otel_attr_*                  │
│       ▼                                                                │
│                                                                        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               │  POST → https://app.posthog.com/capture
                               │  $process_person_profile: false (anonymous)
                               ▼
┌─ PostHog ─────────────────────────────────────────────────────────────┐
│                                                                        │
│   /capture API                                                         │
│       │                                                                │
│       │  One event = one row                                           │
│       ▼                                                                │
│   ClickHouse `events` table                                            │
│       │                                                                │
│       │  HogQL (SQL-like over events)                                  │
│       ▼                                                                │
│   Trends · Dashboards · ad-hoc queries                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

The benchmark code never references PostHog directly. Swapping PostHog for Honeycomb, Grafana Cloud, or any OTLP-native backend means changing the Collector's exporter block — benchmark code stays untouched.

# Design

## Metric naming

Use `effection.benchmark.scenario.duration` as the metric name for scenario timings.

OTEL naming spec rules this satisfies:

1. Lowercase dot-delimited namespacing
2. `snake_case` inside multi-word components
3. No `_total` suffix on counters
4. No unit embedded in the name when the unit is present in the OTEL metadata
5. `{operation}.duration` naming convention for duration histograms

**Use the `effection` reverse-domain prefix.**
The OTEL spec recommends a reverse-domain prefix for project-specific metrics and reserves `otel.*` for the spec itself. The performance-testing ecosystem (Grafana k6, JMeter's OTEL plugin) has settled on tool-specific prefixes rather than mapping to a standard semconv namespace — for the same reason: tool-specific semantics don't safely overlay onto general-purpose semconv names.

**Do not include scenario names in metric names.**
Scenario identity belongs in attributes, not in the metric name. This follows OTEL's low-cardinality naming guidance and lets a single HogQL query cover all scenarios: `WHERE event = 'otel.metric' AND properties.otel_metric_name = 'effection.benchmark.scenario.duration'`.

**Reuse OTEL test semconv for attributes.**
Where OTEL semconv fits, use it. `test.case.name` maps to the scenario name; `test.suite.name` maps to the benchmark suite. These are attribute names, not metric names — they carry the variable identity that the metric name intentionally omits.

## OTLP → PostHog event shape

Every OTLP record maps to one PostHog event using a stable event vocabulary:

- `event = "otel.span"` for spans
- `event = "otel.log"` for LogRecords
- `event = "otel.metric"` for metric DataPoints

The signal's specific identity (metric name, span name) and per-DataPoint attributes both live in properties, not in the event name:

- `properties.otel_metric_name = "effection.benchmark.scenario.duration"`
- `properties.otel_span_name = "effection.benchmark.scenario"`
- `properties.otel_attr_benchmark_scenario = "recursion"`

This keeps the query pattern uniform across all signals — every HogQL query starts with `WHERE event = 'otel.<type>'` and narrows by property. New metrics flow through with no schema change. The stable event vocabulary also matches the convention used by OTLP→PostHog Collector exporters, keeping community HogQL templates and dashboard imports compatible.

## Avoid the cardinality trap

Since every unique combination of attribute values is a separate timeseries, adding attributes that have a high cardinality will grow the number of timeseries with every unique value. `benchmark.scenario="recursion"` has low cardinality because the set of scenario names is small and fixed — every measurement reuses one of a handful of values, so no new timeseries is created. `commit.sha` has high cardinality because every commit produces a new value, and every new value creates a new timeseries.

Avoid putting high-cardinality attributes on **DataPoints**, where they multiply timeseries count. Put them on **Resource** instead — Resource attributes describe the producing process, not the timeseries identity, so commit SHA, runner ID, and pipeline run ID stay queryable without inflating storage.

## Per-iteration instrument

Use raw LogRecords for per-iteration timings — one LogRecord per measured iteration, every sample preserved. PostHog's `quantile()` runs over the raw event property values, so percentiles are computed without bucket-boundary approximation.

The research report (`otel-performance-tracking-research-report.md:80-86`) describes an ExponentialHistogram (`scale ≤ 3`) fallback above ~10,000 iterations per scenario per run, justified by PostHog's 20 MB batch ceiling. At default `repeat=10` and the 20-50 scenario ceiling, the threshold is three orders of magnitude away — the fallback is theoretical and not implemented.

## Observer-effect overhead

Observer-effect overhead occurs when the measurement harness distorts the measurements it is recording. Invoking the OTEL SDK during scenario execution introduces attribute-map construction, object allocation, batch-processor queue writes, and cache pollution — costs that can distort sub-millisecond measurements. We avoid this by starting the scenario span before the loop, buffering per-iteration timings in a fixed-size array during the loop, and emitting one LogRecord per buffered value after the loop ends. End the span last so the LogRecords retain `trace_id` correlation with the scenario span.

Warmup iterations exist to let the JIT inline the scenario code before the first measured iteration, so measurement #1 doesn't pay JIT compilation cost that #2–#10 don't. Emission is already outside the measured window and doesn't need its own warmup.

## Span hierarchy

For each scenario, produce a single span named: `effection.benchmark.scenario`. The span name is consistent across all scenarios (low cardinality); scenarios are identified by attributes:

- `test.case.name` — scenario name (e.g., `"recursion"`)
- `test.suite.name` — benchmark suite (e.g., `"events"`, `"recursion"`)

Warmup iterations run inside the scenario span but emit nothing — they exist
only to JIT the workload before measurement begins. Measurement iterations
buffer their timings during the loop and emit one LogRecord per buffered value
during teardown (see Observer-effect overhead). The span ends after the
teardown emit loop so all LogRecords retain `trace_id` correlation.

## Rejected alternatives

### SpanMetrics Connector

The benefit of the SpanMetrics connector is that it allows you to convert OTEL Span data into OTEL Metric DataPoints without doing extra work. 

For example,
```
Span: effection.benchmark.scenario
  start: 14:32:01.142
  end:   14:32:05.387        → duration = 4245 ms
  attrs: { benchmark.scenario: "recursion" }
```

The SpanMetrics Connector reads spans flowing through the Collector, computes `end - start`, and emits a Histogram metric DataPoint into the metrics pipeline — without any code in your application calling `histogram.record()`.

It's convenient but it was rejected in research because:

1. Its default flush interval is 60 seconds, which may be too quick for an Effection benchmark running in CI. The collector will shut down before recording any data.
2. Connector's bucket boundaries are designed for HTTP latencies in millisecond to second range. For Effection benchmarks, we'll need nanosecond to microsecond level resolution.
3. PostHog expects Delta Temporality, but the SpanMetrics Connector uses Cumulative Temporality. Conversion increases complexity.
4. SpanMetrics requires a Collector sidecar in every CI runner.

### Exemplars to connect metrics to spans

Exemplars exist because Histograms throw away raw samples in exchange for bucket counts. Exemplars provide a representative sample after aggregation.

We're going to record timings using LogRecords with every sample preserved verbatim - we're not going to aggregate at SDK time. We're also not going to record fine-grained spans inside scenarios, at least not for the foreseeable future, which means that we won't have anything to drill into. 

We might reconsider this if we end up having spans with >10k iterations.
