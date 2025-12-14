import type { NextApiRequest, NextApiResponse } from 'next';
import ping from 'ping';
import tcpPing from 'tcp-ping';
import { adjustPing } from './server-info';
import { config } from '../../config/config';

interface Server {
  name: string;
  ip: string;
  port: number;
  status: string;
  ping: number;
}

let cachedData: { services: Server[] } = {
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

const getServerStatus = async () => {
  const servers = config.servers;
  const results: Server[] = [];
  const concurrency = 2;

  for (let i = 0; i < servers.length; i += concurrency) {
    const chunk = servers.slice(i, i + concurrency);

    const res = await Promise.all(
      chunk.map(async (server: Server) => {
        try {
          if (server.port && server.port !== -1) {
            const { alive, time } = await checkPort(server.ip, server.port);
            return {
              name: server.name,
              port: server.port,
              status: alive ? 'Online' : 'Offline',
              ping: alive ? adjustPing(Math.floor(time)) : -1,
            };
          } else {
            const result = await ping.promise.probe(server.ip, { timeout: 1 });
            return {
              name: server.name,
              port: 'ICMP',
              status: result.alive ? 'Online' : 'Offline',
              ping: result.alive ? adjustPing(Math.floor(result.time)) : -1,
            };
          }
        } catch {
          return { service: server.name, port: server.port || 'N/A', status: 'Offline', ping: -1 };
        }
      })
    );

    results.push(...res);
  }

  cachedData.services = results;
};

getServerStatus();

setInterval(async () => {
  await getServerStatus();
}, 10000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ignoreCache } = req.query;
  if (ignoreCache === 'true' || !cachedData.services.length)  await getServerStatus();

  res.status(200).json(cachedData.services);
}
