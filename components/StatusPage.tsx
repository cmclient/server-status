import React, { useEffect, useState } from "react";
import { Text, Card, Table, Badge, Progress, Spacer, Row, Loading } from "@nextui-org/react";
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
  const [services, setServices] = useState<any[]>([]);
  const [serverInfo, setServerInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  const ramUsage = Math.round((serverInfo.ram.used / serverInfo.ram.total) * 100);

  return (
    <>
      <Card css={{ p: "$6", mb: "$8", maxWidth: "75%", margin: "auto", zIndex: 1 }}>
        <Card.Header css={{ justifyContent: "center" }}>
          <Text h3>Service Status</Text>
        </Card.Header>
        <Card.Body>
          <Table aria-label="Service Status Table" css={{ height: "auto", minWidth: "100%" }}>
            {/* @ts-ignore */}
            <Table.Header css={{ textAlign: "center" }}>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Service</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Port</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Status</Table.Column>
              <Table.Column css={{ textAlign: "center", padding: "$4" }}>Ping</Table.Column>
            </Table.Header>
            <Table.Body>
              {services.map((service, idx) => (
                <Table.Row key={idx} css={{ paddingBottom: "$4", paddingTop: "$4" }}>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>{service.service}</Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>{service.port}</Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>
                    <Badge color={service.status === "Online" ? "success" : "error"}>
                      {service.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell css={{ textAlign: "center", padding: "$4" }}>
                    {service.ping === -1 ? (
                      <Badge color="error">Offline</Badge>
                    ) : (
                      <>
                        {getSignalIcon(service.ping)} {service.ping}ms
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

      <Card css={{ p: "$6", maxWidth: "35%", margin: "auto", zIndex: 1 }}>
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
          {serverInfo.cpu?.model && serverInfo.cpu?.model !== "Unknown" && serverInfo.cpu?.model !== "N/A" && (
            <>
              <Row css={{ justifyContent: "center", alignItems: "center" }}>
                <Text b>CPU:</Text>
                <Badge color="primary" css={{ ml: "$2" }}>
                  {serverInfo.cpu?.cores || "N/A"}x {serverInfo.cpu?.model || "N/A"}
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
              {serverInfo.os}
            </Badge>
          </Row>
          <Spacer y={1} />

          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>Disk Usage:</Text>
            <Badge color={getColor(diskUsage)} css={{ ml: "$2" }}>
              {formatSize(serverInfo.disk.used)} / {formatSize(serverInfo.disk.total)}
            </Badge>
          </Row>
          <Spacer y={0.5} />
          <Progress color={getColor(diskUsage)} value={diskUsage} css={{ mt: "$2", width: "30%" }} />
          <Spacer y={1} />

          <Row css={{ justifyContent: "center", alignItems: "center" }}>
            <Text b>RAM Usage:</Text>
            <Badge color={getColor(ramUsage)} css={{ ml: "$2" }}>
              {formatSize(serverInfo.ram.used)} / {formatSize(serverInfo.ram.total)}
            </Badge>
          </Row>
          <Spacer y={0.5} />
          <Progress color={getColor(ramUsage)} value={ramUsage} css={{ mt: "$2", width: "30%" }} />
        </Card.Body>
      </Card>
    </>
  );
};

export default StatusPage;
