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

const formattedMacVersions: Record<string, string> = {
    '10.0': 'Cheetah',
    '10.1': 'Puma',
    '10.2': 'Jaguar',
    '10.3': 'Panther',
    '10.4': 'Tiger',
    '10.5': 'Leopard',
    '10.6': 'Snow Leopard',
    '10.7': 'Lion',
    '10.8': 'Mountain Lion',
    '10.9': 'Mavericks',
    '10.10': 'Yosemite',
    '10.11': 'El Capitan',
    '10.12': 'Sierra',
    '10.13': 'High Sierra',
    '10.14': 'Mojave',
    '10.15': 'Catalina',
    '11': 'Big Sur',
    '12': 'Monterey',
    '13': 'Ventura',
    '14': 'Sonoma',
    '15': 'Sequoia',
    '26': 'Tahoe',
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

        let realDisks = disk;

        if (osInfo.platform === 'darwin') {
            const ignoredMounts = [
                '/',
                '/System/Volumes/VM',
                '/System/Volumes/Preboot',
                '/System/Volumes/Update',
                '/System/Volumes/xarts',
                '/System/Volumes/iSCPreboot',
                '/System/Volumes/Hardware',
            ];

            realDisks = disk.filter(d =>
                !ignoredMounts.includes(d.mount) &&
                d.mount !== '/System/Volumes/Data' &&
                !d.mount.startsWith('/private/')
            );

            const dataVolume = disk.find(d => d.mount === '/System/Volumes/Data');
            if (dataVolume) realDisks.unshift(dataVolume);
        }

        const totalDisk = realDisks.reduce((total, item) => total + (item.size || 0), 0);
        const usedDisk = realDisks.reduce((total, item) => total + (item.used || 0), 0);

        const diskDetails = realDisks.map(d => ({
            mount: d.mount,
            fs: d.fs,
            type: d.type,
            total: d.size,
            used: d.used,
            available: d.available,
            use: d.use
        })).sort((a, b) => {
            if (a.mount === '/System/Volumes/Data') return -1;
            if (b.mount === '/System/Volumes/Data') return 1;
            return a.mount.localeCompare(b.mount);
        });

        let averageLoad;
        if (osInfo.platform === 'Windows' || osInfo.platform === 'win32') {
            const usage = await osu.cpu.usage();
            averageLoad = { 'now': usage };
        } else {
            const load = os.loadavg();
            averageLoad = {
                '1m': load[0].toFixed(2),
                '5m': load[1].toFixed(2),
                '15m': load[2].toFixed(2),
            };
        }

        const osName = osInfo.platform === "darwin"
            ? `macOS ${formattedMacVersions[osInfo.release?.split?.('.')[0] ?? '0'] ?? '0'} ${osInfo.release ?? '0'}`
            : osInfo.distro ?? 'Unknown';

        cachedData.serverInfo = {
            averageLoad,
            uptime: formatUptime(uptime),
            hostname: staticInfo.hostname,
            os: osName,
            arch: osInfo.arch ?? 'Unknown',
            cpu: staticInfo.cpu,
            gpu: staticInfo.gpu,
            disk: {
                total: totalDisk,
                used: usedDisk,
                details: diskDetails
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
