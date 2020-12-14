'use strict';

var promClient = require('prom-client');

const nanosToSec = 1000000000;
function filterUndefined(from) {
    return Object.fromEntries(Object.entries(from).filter(([_, o]) => o));
}
function createMetricsPlugin(register, histogramBuckets) {
    const parsed = new promClient.Counter({
        name: "graphql_queries_parsed",
        help: "The amount of GraphQL queries that have been parsed.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const validationStarted = new promClient.Counter({
        name: "graphql_queries_validation_started",
        help: "The amount of GraphQL queries that have started validation.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const resolved = new promClient.Counter({
        name: "graphql_queries_resolved",
        help: "The amount of GraphQL queries that have had their operation resolved.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const startedExecuting = new promClient.Counter({
        name: "graphql_queries_execution_started",
        help: "The amount of GraphQL queries that have started executing.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const encounteredErrors = new promClient.Counter({
        name: "graphql_queries_errored",
        help: "The amount of GraphQL queries that have encountered errors.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const responded = new promClient.Counter({
        name: "graphql_queries_responded",
        help: "The amount of GraphQL queries that have been executed and been attempted to send to the client. This includes requests with errors.",
        labelNames: ["operationName", "operation"],
        registers: [register]
    });
    const resolverTime = new promClient.Histogram({
        name: "graphql_resolver_time",
        help: "The time to resolve a GraphQL field.",
        labelNames: ["parentType", "fieldName", "returnType"],
        buckets: histogramBuckets,
        registers: [register]
    });
    const totalRequestTime = new promClient.Histogram({
        name: "graphql_total_request_time",
        help: "The time to complete a GraphQL query.",
        labelNames: ["operationName", "operation"],
        buckets: histogramBuckets,
        registers: [register]
    });
    const metricsPlugin = {
        requestDidStart() {
            return {
                parsingDidStart(parsingContext) {
                    var _a;
                    const labels = filterUndefined({
                        operationName: parsingContext.request.operationName || "",
                        operation: (_a = parsingContext.operation) === null || _a === void 0 ? void 0 : _a.operation
                    });
                    parsed.inc(labels);
                },
                validationDidStart(validationContext) {
                    var _a;
                    const labels = filterUndefined({
                        operationName: validationContext.request.operationName || "",
                        operation: (_a = validationContext.operation) === null || _a === void 0 ? void 0 : _a.operation
                    });
                    validationStarted.inc(labels);
                },
                didResolveOperation(resolveContext) {
                    const labels = filterUndefined({
                        operationName: resolveContext.request.operationName || "",
                        operation: resolveContext.operation.operation
                    });
                    resolved.inc(labels);
                },
                executionDidStart(executingContext) {
                    const labels = filterUndefined({
                        operationName: executingContext.request.operationName || "",
                        operation: executingContext.operation.operation
                    });
                    startedExecuting.inc(labels);
                },
                didEncounterErrors(errorContext) {
                    var _a;
                    const labels = filterUndefined({
                        operationName: errorContext.request.operationName || "",
                        operation: (_a = errorContext.operation) === null || _a === void 0 ? void 0 : _a.operation
                    });
                    encounteredErrors.inc(labels);
                },
                willSendResponse(responseContext) {
                    var _a, _b;
                    const labels = filterUndefined({
                        operationName: responseContext.request.operationName || "",
                        operation: (_a = responseContext.operation) === null || _a === void 0 ? void 0 : _a.operation
                    });
                    responded.inc(labels);
                    const tracing = (_b = responseContext.response.extensions) === null || _b === void 0 ? void 0 : _b.tracing;
                    if (tracing && tracing.version === 1) {
                        totalRequestTime.observe(labels, tracing.duration / nanosToSec);
                        tracing.execution.resolvers.forEach(({ parentType, fieldName, returnType, duration }) => {
                            resolverTime.observe({
                                parentType,
                                fieldName,
                                returnType
                            }, duration / nanosToSec);
                        });
                    }
                }
            };
        }
    };
    return metricsPlugin;
}

module.exports = createMetricsPlugin;
