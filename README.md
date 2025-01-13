# Server Monitoring Dashboard

A server monitoring dashboard built with Next.js and NextUI.

## Features

- Real-time server status, including CPU, RAM, disk usage, and uptime.
- Service monitoring (Online/Offline status with ping times).
- Mobile-friendly and responsive design with NextUI.

## Installation

### Prerequisites

- Node.js and npm installed.

### Steps

1. Clone the repository:

   ```
   git clone <repository_url>
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run the development server:

   ```
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser.

## Project Structure

- **Frontend**: Built using Next.js with NextUI for UI components.
  - **components**: Contains UI components like `StatusPage.tsx`, `MusicPlayer.tsx`, etc.
  - **layouts**: Contains layout files like `Layout.tsx`.
  - **public**: Static assets such as `favicon.ico`.
  - **styles**: Global CSS files.

- **Backend**: The backend is a Next.js API that provides server stats and service statuses.
  - **/api/server-info.ts**: Returns server performance data (CPU, RAM, disk usage, etc.).
  - **/api/services.ts**: Checks the status (Online/Offline) of predefined services.

## Configuration

- **config.json**: Modify this file to define the services to monitor and their respective IPs and ports.

## Notes

- The frontend fetches real-time data from the backend APIs (`/api/server-info` and `/api/services`).
- The backend uses various system libraries to collect data about the server's resources and services.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Let me know if you'd like to add more details!