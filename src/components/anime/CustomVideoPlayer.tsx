"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Loader2
} from "lucide-react";

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: () => void;
  initialTime?: number;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CustomVideoPlayer({ src, poster, onTimeUpdate, onError, initialTime = 0 }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<{height: number, width: number}[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    setIsBuffering(true);
    setIsReady(false);

    if (Hls.isSupported() && src.includes(".m3u8")) {
      hls = new Hls({
        capLevelToPlayerSize: true, // Auto-pick max quality relative to player size
        maxBufferLength: 30, // seconds
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (evt, data) => {
        setIsReady(true);
        setIsBuffering(false);
        setQualityLevels(data.levels.map(l => ({ height: l.height, width: l.width })));
        if (initialTime > 0) video.currentTime = initialTime;
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              if (onError) onError();
              break;
          }
        }
      });

      setHlsInstance(hls);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari Native HLS
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsReady(true);
        setIsBuffering(false);
        if (initialTime > 0) video.currentTime = initialTime;
      });
      video.addEventListener("error", () => {
        if (onError) onError();
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src, onError, initialTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const targetMuted = !isMuted;
      videoRef.current.muted = targetMuted;
      setIsMuted(targetMuted);
      if (!targetMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReady || !videoRef.current) return;
      
      // Ignore if user is typing in an input elsewhere
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      switch(e.key.toLowerCase()) {
        case " ": // Spacebar
        case "k": // YouTube style
          e.preventDefault();
          togglePlay();
          resetControlsTimeout();
          break;
        case "j": // backward 10s
          e.preventDefault();
          videoRef.current.currentTime -= 10;
          resetControlsTimeout();
          break;
        case "l": // forward 10s
          e.preventDefault();
          videoRef.current.currentTime += 10;
          resetControlsTimeout();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReady, isPlaying, isMuted, volume]);

  // Controls Visibility
  const hideControls = useCallback(() => {
    if (isPlaying) setShowControls(false);
    setShowSettings(false);
  }, [isPlaying]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(hideControls, 3000); // hide after 3 seconds of inactivity
  }, [hideControls]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  const handleQualityChange = (index: number) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = index;
      setCurrentQuality(index);
    }
    setShowSettings(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black group flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={hideControls}
      onClick={resetControlsTimeout}
    >
      {/* Loading Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 space-y-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full max-h-full object-contain cursor-pointer"
        onClick={() => { togglePlay(); resetControlsTimeout(); setShowSettings(false); }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onTimeUpdate={handleTimeUpdate}
        playsInline
      />

      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="absolute right-4 bottom-20 bg-zinc-900/95 border border-white/10 backdrop-blur rounded-xl p-3 z-30 min-w-40 animate-in slide-in-from-bottom-2 fade-in shadow-2xl">
          <p className="text-xs font-semibold text-zinc-400 mb-2 px-2 uppercase tracking-wider">Quality</p>
          <div className="flex flex-col space-y-1">
            <button 
              onClick={() => handleQualityChange(-1)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentQuality === -1 ? 'bg-purple-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}
            >
              Auto (Recommended)
            </button>
            {qualityLevels.map((lvl, index) => (
              <button 
                key={index} 
                onClick={() => handleQualityChange(index)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentQuality === index ? 'bg-purple-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}
              >
                {lvl.height}p
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Controls UI */}
      <div 
        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-20 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Progress Bar Area */}
        <div className="relative group/timeline w-full h-8 flex flex-col justify-end cursor-pointer mb-2">
          {/* Thumb hint on hover could go here */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 appearance-none rounded-full cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 hover:h-2 transition-all block"
          />
          {/* Progress fill visualizer (behind the thumb) */}
          <div 
            className="absolute bottom-3 left-0 h-1.5 bg-purple-500 rounded-l-full pointer-events-none transition-all group-hover/timeline:h-2"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Lower Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-purple-400 transition-colors p-1"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume relative">
              <button onClick={toggleMute} className="text-white hover:text-purple-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 appearance-none h-1.5 bg-white/20 rounded-full accent-white transition-all duration-300 origin-left"
              />
            </div>

            {/* Time / Duration */}
            <div className="text-sm font-medium text-zinc-300 pointer-events-none tabular-nums tracking-wide">
              {formatTime(currentTime)} <span className="opacity-50 mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings Component */}
            {qualityLevels.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className={`text-white hover:text-purple-400 transition-transform ${showSettings ? "rotate-90 text-purple-400" : ""}`}
              >
                <Settings size={20} />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-purple-400 transition-colors p-1"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
