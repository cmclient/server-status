import type { NextApiRequest, NextApiResponse } from 'next';
import ping from 'ping';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

let cachedData = {
  services: [],
};

const getServiceStatus = async () => {
  const servicesStatus = await Promise.all(
    config.services.map(async (service) => {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!cachedData.services.length) {
    await getServiceStatus(); // Fetch services if not already cached
  }

  res.status(200).json(cachedData.services);
}
