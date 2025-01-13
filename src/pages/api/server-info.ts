import type { NextApiRequest, NextApiResponse } from 'next';
import si from 'systeminformation';
import os from 'os';
import osu from 'node-os-utils';

let cachedData = {
  serverInfo: {},
};

const getServerInfo = async () => {
  try {
    const osInfo = await si.osInfo();
    const memory = await si.mem();
    const disk = await si.fsSize();
    const cpu = await si.cpu();
    const gpu = await si.graphics();

    let uptime;
    if (osInfo.platform === 'Windows' || osInfo.platform === 'win32') {
      const time = await si.time();
      uptime = time.uptime;
    } else {
      const systemInfo = await si.system();
      uptime = systemInfo.uptime;
    }

    const totalDisk = disk.reduce((total, item) => total + (item.size || 0), 0);
    const usedDisk = disk.reduce((total, item) => total + (item.used || 0), 0);

    let averageLoad;
    if (osInfo.platform === 'Windows' || osInfo.platform === 'win32') {
      const usage = await osu.cpu.usage();
      averageLoad = { '1m': usage, '5m': usage, '15m': usage };
    } else {
      const load = os.loadavg();
      if (load && load.length >= 3) {
        averageLoad = {
          '1m': load[0].toFixed(2),
          '5m': load[1].toFixed(2),
          '15m': load[2].toFixed(2),
        };
      } else {
        throw new Error('Failed to retrieve load averages.');
      }
    }

    cachedData.serverInfo = {
      averageLoad,
      uptime: `${Math.floor(uptime / 3600)} hours, ${Math.floor((uptime % 3600) / 60)} minutes`,
      hostname: osInfo.hostname ?? 'None',
      os: osInfo.distro,
      cpu: {
        model: cpu.brand,
        cores: cpu.cores,
      },
      gpu: gpu.controllers && gpu.controllers.length > 0
        ? gpu.controllers.map((g) => g.model).join(', ')
        : 'No GPU found',
      disk: {
        total: totalDisk,
        used: usedDisk,
      },
      ram: {
        total: memory.total,
        used: memory.used,
      },
    };
  } catch (error) {
    console.error('Error getting server info:', error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!cachedData.serverInfo || Object.keys(cachedData.serverInfo).length === 0) {
    await getServerInfo(); // Fetch server info if not already cached
  }

  res.status(200).json(cachedData.serverInfo);
}
