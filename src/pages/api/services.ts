import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { config } from '../../config/config';

interface Service {
  name: string;
  service: string;
  status: string;
}

let cachedData: { services: Service[] } = { services: [] };

const getServiceStatus = async (): Promise<Service[]> => {
  const results: Service[] = [];

  for (const svc of config.services) {
    try {
      let status = 'unknown';

      if (process.platform === 'linux') {
        status = await new Promise<string>((resolve) => {
          exec(`systemctl is-active ${svc.service}`, (err, stdout) => {
            resolve(stdout.trim() || 'unknown');
          });
        });
      } else if (process.platform === 'darwin') {
        status = await new Promise<string>((resolve) => {
          exec(`launchctl list ${svc.service}`, (err, stdout) => {
            if (err || stdout.includes('Could not find service')) return resolve('inactive');
            const match = stdout.match(/"LastExitStatus"\s*=\s*(\d+)/);
            if (match && parseInt(match[1], 10) === 0) resolve('active');
            else resolve('inactive');
          });
        });
      } else {
        status = 'unsupported';
      }

      results.push({ name: svc.name, service: svc.service, status });
    } catch {
      results.push({ name: svc.name, service: svc.service, status: 'error' });
    }
  }

  return results;
};

const updateServices = async () => {
  const services = await getServiceStatus();
  cachedData.services = services;
};

updateServices();

setInterval(async () => {
  await updateServices();
}, 10000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ignoreCache } = req.query;
  if (ignoreCache === 'true' || cachedData.services.length === 0) await updateServices();

  res.status(200).json(cachedData.services);
}
