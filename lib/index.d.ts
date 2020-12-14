import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { Registry } from "prom-client";
export default function createMetricsPlugin(register: Registry, histogramBuckets: Array<number>): ApolloServerPlugin;
