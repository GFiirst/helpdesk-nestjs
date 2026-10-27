import 'dotenv/config';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter as GrpcLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPLogExporter as HttpLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter as GrpcMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPMetricExporter as HttpMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter as GrpcTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as HttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

const enabled = process.env.OTEL_ENABLED === 'true';
let sdk: NodeSDK | undefined;

if (enabled) {
  const protocol = process.env.OTEL_EXPORTER_OTLP_PROTOCOL ?? 'grpc';
  const defaultEndpoint = protocol === 'grpc' ? 'http://localhost:4317' : 'http://localhost:4318';
  const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? defaultEndpoint).replace(/\/$/, '');
  const serviceName = process.env.OTEL_SERVICE_NAME?.trim() || 'helpdesk-nestjs';
  const exportInterval = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL_MS ?? 10000);
  const metricExportInterval = Number.isInteger(exportInterval) && exportInterval > 0 ? exportInterval : 10000;
  const grpc = protocol === 'grpc';
  const traceExporter = grpc ? new GrpcTraceExporter({ url: endpoint }) : new HttpTraceExporter({ url: `${endpoint}/v1/traces` });
  const metricExporter = grpc ? new GrpcMetricExporter({ url: endpoint }) : new HttpMetricExporter({ url: `${endpoint}/v1/metrics` });
  const logExporter = grpc ? new GrpcLogExporter({ url: endpoint }) : new HttpLogExporter({ url: `${endpoint}/v1/logs` });

  sdk = new NodeSDK({
    resource: defaultResource().merge(
      resourceFromAttributes({
        'service.name': serviceName,
        'service.version': process.env.OTEL_SERVICE_VERSION ?? '0.0.1',
        'deployment.environment.name': process.env.NODE_ENV ?? 'development',
      }),
    ),
    traceExporter,
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: metricExportInterval,
      }),
    ],
    logRecordProcessors: [new BatchLogRecordProcessor({ exporter: logExporter })],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (request) => request.url === '/health',
        },
      }),
    ],
  });

  sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown();
}
