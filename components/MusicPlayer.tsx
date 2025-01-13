import React, { useState, useEffect } from "react";
import { Button, Text } from "@nextui-org/react";
import { Icon } from "@iconify/react";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const songTitle = "Thank FreakBob";
  const songArtist = "West Coast";
  const songImage = "https://cdn.cmclient.pl/other/maxresdefault.jpg"; // Placeholder image

  useEffect(() => {
    const audioPlayer = new Audio("https://cdn.cmclient.pl/other/freakbobxd.mp3"); // Example file
    setAudio(audioPlayer);

    audioPlayer.onloadedmetadata = () => {
      setDuration(audioPlayer.duration);
      // Set the media session metadata (title, artist, artwork) when the song is loaded
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: songTitle,
          artist: songArtist,
          album: "FreakBob Album", // You can change this as needed
          artwork: [
            { src: songImage, sizes: '96x96', type: 'image/jpeg' },
            { src: songImage, sizes: '128x128', type: 'image/jpeg' },
            { src: songImage, sizes: '192x192', type: 'image/jpeg' },
            { src: songImage, sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      }
    };

    audioPlayer.ontimeupdate = () => {
      setCurrentTime(audioPlayer.currentTime);
    };

    // Handle play and pause events directly from the audio element
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioPlayer.onplay = handlePlay;
    audioPlayer.onpause = handlePause;

    // Sync play/pause state based on the audio player and external controls
    const handleMediaControl = () => {
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    };

    // Handle media session actions (play/pause from external controls)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', handleMediaControl);
      navigator.mediaSession.setActionHandler('pause', handleMediaControl);
    }

    // Event listener for when the song ends
    audioPlayer.onended = () => setIsPlaying(false);

    // Cleanup
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }

      // Cleanup media session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.metadata = null; // Clear metadata when the component is unmounted
      }

      // Remove event listeners when component is unmounted
      audioPlayer.onplay = null;
      audioPlayer.onpause = null;
    };
  }, []);

  const handlePlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (audio) {
      const progressBar = e.currentTarget as HTMLDivElement;
      const clickPosition = e.nativeEvent.offsetX / progressBar.offsetWidth;
      audio.currentTime = clickPosition * duration;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "400px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "10px",
        borderRadius: "10px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
      }}
    >
      <img
        src={songImage}
        alt="Song Cover"
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          marginRight: "10px",
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Text h4 css={{ color: "white", marginBottom: "5px" }}>
              {songTitle}
            </Text>
            <Text css={{ color: "#ccc", fontSize: "12px", marginBottom: "10px" }}>
              {songArtist}
            </Text>
          </div>
          <Button
            auto
            flat
            onClick={handlePlayPause}
            css={{ minWidth: "40px", padding: "0", marginLeft: "10px" }}
          >
            <Icon
              icon={isPlaying ? "mdi:pause" : "mdi:play"}
              style={{ fontSize: "24px", color: "white" }}
            />
          </Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "5px" }}>
          <Text css={{ color: "white", fontSize: "12px", marginRight: "10px" }}>
            {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)
              .toString()
              .padStart(2, "0")}`}
          </Text>
          <div
            style={{
              flex: 1,
              height: "8px",
              backgroundColor: "#ccc",
              borderRadius: "5px",
              cursor: "pointer",
              marginLeft: "10px",
              marginRight: "10px",
            }}
            onClick={handleProgressClick}
          >
            <div
              style={{
                width: `${(currentTime / duration) * 100}%`,
                height: "100%",
                backgroundColor: "#1db954", // Spotify green
                borderRadius: "5px",
              }}
            ></div>
          </div>
          <Text css={{ color: "white", fontSize: "12px" }}>
            {`${Math.floor(duration / 60)}:${Math.floor(duration % 60)
              .toString()
              .padStart(2, "0")}`}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
