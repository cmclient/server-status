import React from "react";
import { Button, Spacer } from "@nextui-org/react";
import { Icon } from '@iconify/react'; 
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import PageLayout from "@/layouts/Layout";
import MusicPlayer from "@/components/MusicPlayer";
import StatusPage from "@/components/StatusPage";

const HomePage = ({ toggleTheme }) => {
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  const particlesOptions = {
    particles: {
      number: {
        value: 150,
      },
      size: {
        value: 3,
        animation: {
          enable: true,
          speed: 5,
          sync: true,
        },
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "out",
        },
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200,
        },
      },
      opacity: {
        value: 0.5,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
        },
      },
      shape: {
        type: "circle",
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.4,
      },
    },
    interactivity: {
      events: {
        onhover: {
          enable: true,
          mode: "repulse",
          distance: 100,
        },
      },
    },
    fpsLimit: 144,
  };

  return (
    <PageLayout title="Server Status">
      <Particles
        id="tsparticles"
        init={particlesInit}
        // @ts-ignore
        options={particlesOptions} 
        style={{
          position: "absolute",
          zIndex: 0,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      />

      <Button
        auto
        icon={<Icon icon="mdi:moon-waxing-crescent" />}
        onClick={toggleTheme}
        css={{
          position: "absolute",
          top: "$4",
          right: "$4",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          padding: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
          color: "$text",
          border: "2px solid $primary",  
          zIndex: 10,
        }}
      />

      <Spacer y={2} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          width: "100%",
          position: "relative",
        }}
      >
        <StatusPage />
      </div>

      <MusicPlayer />
    </PageLayout>
  );
};

export default HomePage;
