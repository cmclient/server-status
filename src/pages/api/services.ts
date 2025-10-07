import type { NextApiRequest, NextApiResponse } from 'next';
import ping from 'ping';
import fs from 'fs';
import tcpPing from 'tcp-ping';
import { adjustPing } from './server-info';

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

interface ServiceStatus {
  service: string;
  port: number;
  status: string;
  ping: number;
}

let cachedData: { services: ServiceStatus[] } = {
  services: [],
};

const checkPort = (host: string, port: number, timeout = 1000): Promise<{ alive: boolean; time: number }> => {
  return new Promise((resolve) => {
    tcpPing.ping({ address: host, port, timeout, attempts: 1 }, (err, data) => {
      if (err || !data || data.results.length === 0) {
        return resolve({ alive: false, time: timeout });
      }
      const result = data.results[0];
      resolve({ alive: !result.err, time: result.time });
    });
  });
};

const getServiceStatus = async () => {
  const services = config.services;
  const results: ServiceStatus[] = [];
  const concurrency = 2;

  for (let i = 0; i < services.length; i += concurrency) {
    const chunk = services.slice(i, i + concurrency);

    const res = await Promise.all(
      chunk.map(async (service: { ip: string; port?: number; service: string }) => {
        try {
          if (service.port && service.port !== -1) {
            const { alive, time } = await checkPort(service.ip, service.port);
            return {
              service: service.service,
              port: service.port,
              status: alive ? 'Online' : 'Offline',
              ping: alive ? adjustPing(Math.floor(time)) : -1,
            };
          } else {
            const result = await ping.promise.probe(service.ip, { timeout: 1 });
            return {
              service: service.service,
              port: 'ICMP',
              status: result.alive ? 'Online' : 'Offline',
              ping: result.alive ? adjustPing(Math.floor(result.time)) : -1,
            };
          }
        } catch {
          return { service: service.service, port: service.port || 'N/A', status: 'Offline', ping: -1 };
        }
      })
    );

    results.push(...res);
  }

  cachedData.services = results;
};

getServiceStatus();

setInterval(async () => {
  await getServiceStatus();
}, 10000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ignoreCache } = req.query;

  if (ignoreCache === 'true' || !cachedData.services.length) {
    await getServiceStatus();
  }

  res.status(200).json(cachedData.services);
}
