import client from "prom-client";
import type { Request, Response } from "express";

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export async function metricsHandler(_req: Request, res: Response) {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
}
