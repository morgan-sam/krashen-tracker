import { useState, useEffect, useRef } from "preact/hooks";
import { updateTimeLog } from "./timeUtils";
import { supabase } from "./supabase";

const NEWS_CHANNELS = [
  {
    title: "LN+ EN VIVO | Últimas noticias de Argentina y el mundo",
    videoId: "G5pHuBCqgrs",
  },
  {
    title: "TN EN VIVO I SEGUÍ LA TRANSMISIÓN EN VIVO DE TODO NOTICIAS",
    videoId: "cb12KmMMDJA",
  },
  {
    title: "EN VIVO: Univision Noticias 24/7",
    videoId: "V4C7VNfRATA",
  },
  {
    title: "🔴 DW Español | En vivo",
    videoId: "Io5mt83nCcU",
  },
  {
    title: "euronews en directo",
    videoId: "O9mOtdZ-nSk",
  },
  {
    title: "FRANCE 24 Español – EN VIVO",
    videoId: "Y-IlMeCCtIg",
  },
];

const Player = ({ email }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [totalDayTime, setTotalDayTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(NEWS_CHANNELS[0]);
  const playerRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Fetch total time for today when component mounts
  useEffect(() => {
    const fetchTodayTotal = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("time_logs")
        .select("total_seconds")
        .eq("email", email)
        .eq("date", today)
        .single();

      if (data) {
        setTotalDayTime(data.total_seconds);
        lastUpdateRef.current = data.total_seconds;
      }
    };

    fetchTodayTotal();
  }, [email]);

  // Initialize YouTube API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window["onYouTubeIframeAPIReady"] = () => {
      createPlayer(selectedChannel.videoId);
    };
  }, []);

  const createPlayer = (videoId) => {
    playerRef.current = new window["YT"].Player("youtube-player", {
      videoId: videoId,
      events: {
        onStateChange: onPlayerStateChange,
      },
      playerVars: {
        playsinline: 1,
        modestbranding: 1,
        controls: 0,
      },
    });
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 1) {
      // Playing
      setIsBuffering(false);
      startTimer();
      setIsPlaying(true);
    } else if (event.data === 2) {
      // Paused
      setIsBuffering(false);
      stopTimer();
      setIsPlaying(false);

      // Update any remaining time since last 15-second boundary
      const timeSinceLastUpdate = totalDayTime - lastUpdateRef.current;
      if (timeSinceLastUpdate > 0) {
        updateTimeLog(email, timeSinceLastUpdate)
          .then(() => {
            lastUpdateRef.current = totalDayTime;
          })
          .catch(console.error);
      }
    } else if (event.data === 3) {
      setIsBuffering(true);
      stopTimer();
    } else {
      setIsBuffering(false);
    }
  };

  const handleChannelChange = (event) => {
    const newChannel = NEWS_CHANNELS.find(
      (channel) => channel.videoId === event.target.value
    );
    setSelectedChannel(newChannel);
    setIsBuffering(true);
    stopTimer();

    // Update any remaining time since last 15-second boundary
    const timeSinceLastUpdate = totalDayTime - lastUpdateRef.current;
    if (timeSinceLastUpdate > 0) {
      updateTimeLog(email, timeSinceLastUpdate)
        .then(() => {
          lastUpdateRef.current = totalDayTime;
        })
        .catch(console.error);
    }

    if (playerRef.current) {
      playerRef.current.loadVideoById({
        videoId: newChannel.videoId,
      });
    }
  };

  const startTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = window.setInterval(() => {
      setTotalDayTime((prev) => {
        const newTotal = prev + 1;
        // Check if we've crossed a 15-second boundary
        if (newTotal % 15 === 0) {
          console.log(`15-second boundary hit at ${newTotal} seconds`);
          updateTimeLog(email, 15)
            .then(() => {
              lastUpdateRef.current = newTotal;
            })
            .catch(console.error);
        }
        return newTotal;
      });
    }, 1000);

    setIntervalId(id);
  };

  const stopTimer = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (!isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
        {/* Channel Selector */}
        <div className="mb-4">
          <select
            value={selectedChannel.videoId}
            onChange={handleChannelChange}
            className="w-full p-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200"
          >
            {NEWS_CHANNELS.map((channel) => (
              <option key={channel.videoId} value={channel.videoId}>
                {channel.title}
              </option>
            ))}
          </select>
        </div>

        {/* Hidden YouTube Player */}
        <div className="hidden">
          <div id="youtube-player" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-4 rounded-lg">
          <button
            onClick={togglePlayPause}
            disabled={isBuffering}
            className="text-5xl w-20 h-20 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors relative"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-600 border-t-blue-500 animate-spin"></div>
            ) : isPlaying ? (
              "⏸️"
            ) : (
              "▶️"
            )}
          </button>

          <div className="flex flex-col items-end">
            <div className="text-3xl font-mono text-gray-800 dark:text-gray-200">
              {formatTime(totalDayTime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Today's total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
