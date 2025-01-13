import type { NextApiRequest, NextApiResponse } from 'next';
import ping from 'ping';
import fs from 'fs';

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

const getServiceStatus = async () => {
  const servicesStatus = await Promise.all(
    config.services.map(async (service: { ip: any; port: any; service: any; }) => {
      try {
        const res = await ping.promise.probe(service.ip, {
          port: service.port,
          timeout: 1,
        });
        return {
          service: service.service,
          port: service.port,
          status: res.alive ? 'Online' : 'Offline',
          ping: res.alive ? res.time : -1,
        };
      } catch (error) {
        return {
          service: service.service,
          port: service.port,
          status: 'Offline',
          ping: -1,
        };
      }
    })
  );
  cachedData.services = servicesStatus;
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
