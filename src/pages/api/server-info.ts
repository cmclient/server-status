import type { NextApiRequest, NextApiResponse } from 'next';
import si from 'systeminformation';
import os from 'os';
import osu from 'node-os-utils';

let cachedCpuGpuInfo = {
    cpu: "Unknown",
    gpu: "Unknown",
    hostname: "Unknown",
    cpuCores: 0,
};

let cachedData = {
    serverInfo: {},
};

const formatUptime = (uptimeInSeconds: number): string => {
    const units = [
        { label: 'year', seconds: 365 * 24 * 3600 },
        { label: 'month', seconds: 30 * 24 * 3600 },
        { label: 'day', seconds: 24 * 3600 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];

    const result: string[] = [];
    let remaining = uptimeInSeconds;

    for (const { label, seconds } of units) {
        const count = Math.floor(remaining / seconds);
        if (count > 0) {
            result.push(`${count} ${label}${count > 1 ? 's' : ''}`);
            remaining %= seconds;
        }
    }

    return result.join(', ');
};

const fetchInitialCpuGpuInfo = async () => {
    try {
        const cpu = await si.cpu();
        cachedCpuGpuInfo.cpu = cpu.brand;
        cachedCpuGpuInfo.cpuCores = cpu.cores;

        const gpu = await si.graphics();
        cachedCpuGpuInfo.gpu = gpu.controllers && gpu.controllers.length > 0
            ? gpu.controllers.map((g) => g.model).join(', ')
            : 'Unknown';

        const osInfo = await si.osInfo();
        cachedCpuGpuInfo.hostname = osInfo.hostname ?? 'Unknown';

    } catch (error) {
        console.error('Error fetching CPU/GPU/Hostname info:', error);
    }
};

const getServerInfo = async () => {
    try {
        const osInfo = await si.osInfo();
        const memory = await si.mem();
        const disk = await si.fsSize();
        const time = await si.time();
        const uptime = time.uptime;

        const totalDisk = disk.reduce((total, item) => total + (item.size || 0), 0);
        const usedDisk = disk.reduce((total, item) => total + (item.used || 0), 0);

        let averageLoad;
        if (osInfo.platform === 'Windows' || osInfo.platform === 'win32') {
            const usage = await osu.cpu.usage();
            averageLoad = { 'now': usage };
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
            uptime: formatUptime(uptime),
            hostname: cachedCpuGpuInfo.hostname,
            os: osInfo.distro ?? 'Unknown',
            cpu: {
                model: cachedCpuGpuInfo.cpu,
                cores: cachedCpuGpuInfo.cpuCores,
            },
            gpu: cachedCpuGpuInfo.gpu,
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

fetchInitialCpuGpuInfo();

setInterval(async () => {
    await getServerInfo();
}, 10000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { ignoreCache } = req.query;

    if (ignoreCache === 'true' || !cachedData.serverInfo || Object.keys(cachedData.serverInfo).length === 0) {
        await getServerInfo();
    }

    res.status(200).json(cachedData.serverInfo);
}
