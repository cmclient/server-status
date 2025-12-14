import { useEffect, useState } from "react";
import { Text, Card, Table, Progress, Spacer, Row, Loading, Tooltip, Badge } from "@nextui-org/react";
import { Icon } from '@iconify/react';

const formatSize = (size: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let adjustedSize = size;

  while (adjustedSize > 1024 && unitIndex < units.length - 1) {
    adjustedSize /= 1024;
    unitIndex++;
  }

  return `${adjustedSize.toFixed(2)} ${units[unitIndex]}`;
};

const getColor = (percent: number) => {
  if (percent < 30) return "success";
  if (percent < 60) return "primary";
  if (percent < 75) return "warning";
  return "error";
};

const getSignalIcon = (ping: number) => {
  if (ping === -1) return <Icon icon="mdi:signal-off" />; // Offline
  if (ping <= 20) return <Icon icon="material-symbols-light:signal-cellular-4-bar-rounded" />; // Full signal (4 lines)
  if (ping <= 50) return <Icon icon="material-symbols-light:signal-cellular-3-bar-rounded" />; // 3/4 signal lines
  if (ping <= 100) return <Icon icon="material-symbols-light:signal-cellular-2-bar-rounded" />; // 2/4 signal lines
  return <Icon icon="material-symbols-light:signal-cellular-1-bar-rounded" />; // 1/4 signal line
};

const StatusPage = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [serverInfo, setServerInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serversResponse = await fetch('/api/servers');
        const serversData = await serversResponse.json();
        setServers(serversData);

        const servicesResponse = await fetch('/api/services');
        const servicesData = await servicesResponse.json();
        setServices(servicesData);

        const serverInfoResponse = await fetch('/api/server-info');
        const serverInfoData = await serverInfoResponse.json();
        setServerInfo(serverInfoData);

        setLoading(false);
        setError("");
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false);
        setError("Failed to load data");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading size="xl">Loading data...</Loading>;
  if (error) return <Badge enableShadow disableOutline color="error">{error}</Badge>;

  const diskUsage = Math.round((serverInfo.disk.used / serverInfo.disk.total) * 100);
  const ramUsage = Math.round((serverInfo.ram.active / serverInfo.ram.total) * 100);

  return (
    <>
      <Card className="table-card">
        <Card.Header css={{ justifyContent: "center" }}>
          <Text h3>Server Status</Text>
        </Card.Header>
        <Card.Body>
          <Table aria-label="Server Status Table" css={{ height: "auto", minWidth: "100%" }}>
            {/* @ts-ignore */}
            <Table.Header css={{ textAlign: "center" }}>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Name</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Port</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Status</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Ping</Table.Column>
            </Table.Header>
            <Table.Body>
              {servers.map((server, idx) => (
                <Table.Row key={idx} css={{ paddingBottom: "$4", paddingTop: "$4" }}>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>{server.name}</Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>{server.port}</Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>
                    <Badge color={server.status === "Online" ? "success" : "error"}>
                      {server.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>
                    {server.ping === -1 ? (
                      <Badge color="error">Offline</Badge>
                    ) : (
                      <>
                        {getSignalIcon(server.ping)} {server.ping}ms
                      </>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      <Spacer y={2} />

      <Card className="serverInfo">
        <Card.Header css={{ justifyContent: "center" }}>
          <Text h3>Server Information</Text>
        </Card.Header>
        <Card.Body css={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>Average Load:</Text>
            {Object.entries(serverInfo.averageLoad as Record<string, number>).map(([key, value]) => (
              <Badge key={key} color={getColor(value)} css={{ ml: "$2" }}>
                {value}% ({key})
              </Badge>
            ))}
          </Row>
          <Spacer y={1} />
          {serverInfo.cpu && serverInfo.cpu.brand && serverInfo.cpu.brand !== "N/A" && (
            <>
              <Row css={{ justifyContent: "center", alignItems: "center" }}>
                <Text b>CPU:</Text>
                <Badge color="primary" css={{ ml: "$2" }}>
                  {serverInfo.cpu.cores || 0}x {serverInfo.cpu.vendor || "N/A"} {serverInfo.cpu.brand || "N/A"}
                </Badge>
              </Row>
              <Spacer y={1} />
            </>
          )}
          {serverInfo.gpu && serverInfo.gpu !== "Unknown" && serverInfo.gpu !== "N/A" && (
            <>
              <Row css={{ justifyContent: "center", alignItems: "center" }}>
                <Text b>GPU:</Text>
                <Badge color="primary" css={{ ml: "$2" }}>
                  {serverInfo.gpu}
                </Badge>
              </Row>
              <Spacer y={1} />
            </>
          )}
          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>Uptime:</Text>
            <Badge color="primary" css={{ ml: "$2" }}>
              {serverInfo.uptime}
            </Badge>
          </Row>
          <Spacer y={1} />
          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>Hostname:</Text>
            <Badge color="primary" css={{ ml: "$2" }}>
              {serverInfo.hostname}
            </Badge>
          </Row>
          <Spacer y={1} />
          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>System:</Text>
            <Badge color="primary" css={{ ml: "$2" }}>
              {serverInfo.os} {serverInfo.arch}
            </Badge>
          </Row>

          <Spacer y={1} />

          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>RAM Usage:</Text>
            <Tooltip
              content={
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                  <div style={{ borderBottom: '1px solid #444', paddingBottom: 4, marginBottom: 4 }}>
                    <strong>RAM</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Total:</span>
                    <span>{formatSize(serverInfo.ram.total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Used:</span>
                    <span>{formatSize(serverInfo.ram.used)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Free:</span>
                    <span>{formatSize(serverInfo.ram.free)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Active:</span>
                    <span>{formatSize(serverInfo.ram.active)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Available:</span>
                    <span>{formatSize(serverInfo.ram.available)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #444', paddingTop: 4, marginTop: 4 }}>
                    <strong>Swap</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Used:</span>
                    <span>{formatSize(serverInfo.ram.swapused)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Free:</span>
                    <span>{formatSize(serverInfo.ram.swapfree)}</span>
                  </div>
                </div>
              }
              css={{
                backgroundColor: '#222',
                color: 'white',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: '0.85rem',
              }}
              placement="top"
            >
              <Badge color={getColor(ramUsage)} css={{ ml: "$2", cursor: "pointer" }}>
                {formatSize(serverInfo.ram.active)} / {formatSize(serverInfo.ram.total)}
              </Badge>
            </Tooltip>
          </Row>

          <Spacer y={0.5} />
          <Progress color={getColor(ramUsage)} value={ramUsage} css={{ mt: "$2", width: "30%" }} />

          <Spacer y={1} />
          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>Disk Usage:</Text>
            <Tooltip
              content={
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {serverInfo.disk.details?.map((d: any, idx: number) => {
                    const usagePercent = ((d.used / d.total) * 100).toFixed(1);
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
                        <span>
                          <b>{d.mount}</b>: {formatSize(d.used)} / {formatSize(d.total)} (<b>{usagePercent}%</b>)
                        </span>
                        <Progress
                          value={parseFloat(usagePercent)}
                          color={getColor(parseFloat(usagePercent))}
                          size="sm"
                          css={{ width: "100%" }}
                        />
                      </div>
                    );
                  })}
                </div>
              }
              css={{
                backgroundColor: '#222',
                color: 'white',
              }}
              placement="top"
            >
              <Badge color={getColor(diskUsage)} css={{ ml: "$2", cursor: "pointer" }}>
                {formatSize(serverInfo.disk.used)} / {formatSize(serverInfo.disk.total)}
              </Badge>
            </Tooltip>

          </Row>
          <Spacer y={0.5} />
          <Progress color={getColor(diskUsage)} value={diskUsage} css={{ mt: "$2", width: "30%" }} />

          <Spacer y={1} />
          <Row css={{ justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "$2" }}>
            <Text b>Services:</Text>
            {services.map((svc, idx) => (
              <Tooltip
                key={idx}
                content={
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span><b>Service:</b> {svc.service}</span>
                    <span><b>Status:</b> {svc.status}</span>
                  </div>
                }
                css={{
                  backgroundColor: '#222',
                  color: 'white',
                }}
                placement="top"
              >
                <Badge
                  color={
                    svc.status === "active" || svc.status === "Online"
                      ? "success"
                      : svc.status === "inactive" || svc.status === "Offline"
                        ? "error"
                        : "warning"
                  }
                  css={{ cursor: "pointer" }}
                >
                  {svc.name}
                </Badge>
              </Tooltip>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default StatusPage;
