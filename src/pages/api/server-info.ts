import type { NextApiRequest, NextApiResponse } from 'next';
import si from 'systeminformation';
import os from 'os';
import osu from 'node-os-utils';

interface ServerInfo {
    os: string;
    arch: string;
    hostname: string;
    averageLoad: any;
    uptime: string;
    cpu: {
        model: string;
        cores: number;
    };
    gpu: string;
    disk: {
        total: number;
        used: number;
    };
    ram: {
        total: number;
        used: number;
    };
}

const formattedVendorNames: { [key: string]: string } = {
    'AuthenticAMD': 'AMD',
};

let staticInfo = {
    cpu: {
        vendor: 'Unknown',
        brand: 'Unknown',
        cores: 0
    },
    gpu: 'Unknown',
    hostname: 'Unknown',
};

let cachedData: { serverInfo: ServerInfo | {} } = {
    serverInfo: {},
};

// Subtract 1ms from ping on macOS ARM64 (Apple Silicon) due to increased latency 
// from the Apple LAN chip used in Mac Mini. This normalizes results to be
// comparable with Intel-based PCs.
export const adjustPing = (ping: number): number => {
    if (cachedData.serverInfo && (cachedData.serverInfo as ServerInfo).os === 'macOS' && (cachedData.serverInfo as ServerInfo).arch === 'arm64') {
        return Math.max(0, ping - 1);
    }
    return ping;
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

const fetchStaticInfo = async () => {
    try {
        const cpu = await si.cpu();
        staticInfo.cpu.vendor = formattedVendorNames[cpu.vendor] || cpu.vendor;
        staticInfo.cpu.brand = cpu.brand;
        staticInfo.cpu.cores = cpu.cores;

        const gpu = await si.graphics();
        staticInfo.gpu = gpu.controllers && gpu.controllers.length > 0
            ? gpu.controllers.map((g) => g.model).join(', ')
            : 'Unknown';

        const osInfo = await si.osInfo();
        staticInfo.hostname = osInfo.hostname ?? 'Unknown';
    } catch (error) {
        console.error('Error fetching static info:', error);
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
            hostname: staticInfo.hostname,
            os: osInfo.distro ?? 'Unknown',
            arch: osInfo.arch ?? 'Unknown',
            cpu: staticInfo.cpu,
            gpu: staticInfo.gpu,
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

const init = async () => {
    await fetchStaticInfo();
    await getServerInfo();

    setInterval(async () => {
        await getServerInfo();
    }, 10000);
};

init();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { ignoreCache } = req.query;

    if (ignoreCache === 'true' || !cachedData.serverInfo || Object.keys(cachedData.serverInfo).length === 0) {
        await getServerInfo();
    }

    res.status(200).json(cachedData.serverInfo);
}
