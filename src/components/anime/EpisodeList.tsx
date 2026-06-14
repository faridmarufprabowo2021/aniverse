"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Tv, Globe, MonitorPlay,
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Search,
  ChevronLeft, ChevronRight, Monitor, Wifi, SkipForward, Timer,
  ChevronDown, ChevronUp, X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { 
  getAnimeDataWithFallback,
  getAnimeDataFromProvider,
  loadAnimeDetailFromProvider,
  MultiProviderResult,
  ProviderConfig,
  ProviderKey,
  PROVIDERS_CONFIG,
  SankaEpisodeItem,
  SankaSearchItem,
  SankaQualityGroup,
  SankaServerItem,
  SankaEpisodeDetail,
} from "@/lib/api/sanka";
import { addToWatchHistory, getLastWatchedEpisode, WatchHistoryItem, updateWatchProgress } from "@/lib/watchHistory";
import { CustomVideoPlayer } from "./CustomVideoPlayer";

// ═══════════════════════════════════════
// SMART REDIRECT PROVIDERS (External)
// ═══════════════════════════════════════

interface StreamProvider {
  name: string;
  icon: string;
  color: string;
  searchUrl: (title: string) => string;
  description: string;
  lang: string;
}

const REDIRECT_PROVIDERS: StreamProvider[] = [
  {
    name: "OtakuDesu",
    icon: "🇮🇩",
    color: "#9333ea",
    searchUrl: (title) => `https://otakudesu.cloud/?s=${encodeURIComponent(title)}&post_type=anime`,
    description: "Sub Indo terlengkap",
    lang: "ID",
  },
  {
    name: "Samehadaku",
    icon: "🇮🇩",
    color: "#ec4899",
    searchUrl: (title) => `https://samehadaku.email/?s=${encodeURIComponent(title)}`,
    description: "Sub Indo populer",
    lang: "ID",
  },
  {
    name: "Kusonime",
    icon: "🇮🇩",
    color: "#f59e0b",
    searchUrl: (title) => `https://kusonime.com/?s=${encodeURIComponent(title)}`,
    description: "Batch & per episode",
    lang: "ID",
  },
  {
    name: "Crunchyroll",
    icon: "🌏",
    color: "#f47521",
    searchUrl: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
    description: "Resmi & legal",
    lang: "EN/ID",
  },
  {
    name: "MyAnimeList",
    icon: "📋",
    color: "#2e51a2",
    searchUrl: (title) => `https://myanimelist.net/anime.php?q=${encodeURIComponent(title)}&cat=anime`,
    description: "Info lengkap",
    lang: "EN",
  },
];

// ═══════════════════════════════════════
// IN-APP PLAYER COMPONENT (Multi-Provider)
// ═══════════════════════════════════════

function InAppPlayer({ 
  episode, 
  provider, 
  onBack,
  allEpisodes,
  onSelectEpisode,
  onSwitchProvider,
  animeId,
  coverImage,
}: { 
  episode: SankaEpisodeItem; 
  provider: ProviderConfig; 
  onBack: () => void;
  allEpisodes: SankaEpisodeItem[];
  onSelectEpisode: (ep: SankaEpisodeItem) => void;
  onSwitchProvider?: (providerKey: ProviderKey) => void;
  animeId: number;
  coverImage?: string;
}) {
  const [selectedServer, setSelectedServer] = useState<SankaServerItem | null>(null);
  const [selectedStreamLink, setSelectedStreamLink] = useState<number>(0);
  const [useDefaultUrl, setUseDefaultUrl] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  // Auto-play next episode
  const [showAutoPlay, setShowAutoPlay] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(5);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);
  
  // Skip intro (show button for first 90 seconds)
  const [showSkipIntro, setShowSkipIntro] = useState(true);
  const [skipTimerId, setSkipTimerId] = useState<NodeJS.Timeout | null>(null);

  // Find next/prev episode
  const currentIdx = allEpisodes.findIndex(e => e.episodeId === episode.episodeId);
  const nextEpisode = currentIdx > 0 ? allEpisodes[currentIdx - 1] : null; // reversed array 
  const prevEpisode = currentIdx < allEpisodes.length - 1 ? allEpisodes[currentIdx + 1] : null;

  // Fetch episode detail from the active provider
  const { data: episodeDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: ['episode_detail', provider.key, episode.episodeId],
    queryFn: () => provider.episodeFn(episode.episodeId),
  });

  // Fetch custom server embed URL (only for Samehadaku/Otakudesu when user selects a server)
  const { data: customEmbedUrl, isLoading: isLoadingEmbed, error: embedError } = useQuery({
    queryKey: ['server_embed', provider.key, selectedServer?.serverId],
    queryFn: () => provider.serverFn!(selectedServer!.serverId),
    enabled: !!selectedServer && !useDefaultUrl && !!provider.serverFn,
  });

  // Hide skip intro after 90 seconds
  useEffect(() => {
    setShowSkipIntro(true);
    const timer = setTimeout(() => setShowSkipIntro(false), 90000);
    setSkipTimerId(timer);
    return () => clearTimeout(timer);
  }, [episode.episodeId]);

  // Auto-play countdown logic
  useEffect(() => {
    if (!showAutoPlay || autoPlayCancelled) return;
    if (autoPlayCountdown <= 0 && nextEpisode) {
      onSelectEpisode(nextEpisode);
      return;
    }
    const timer = setTimeout(() => setAutoPlayCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showAutoPlay, autoPlayCountdown, autoPlayCancelled, nextEpisode, onSelectEpisode]);

  // Reset states when episode changes
  useEffect(() => {
    setIframeError(false);
    setShowAutoPlay(false);
    setAutoPlayCountdown(5);
    setAutoPlayCancelled(false);
    setSelectedServer(null);
    setSelectedStreamLink(0);
    setUseDefaultUrl(true);
  }, [episode.episodeId]);

  // ★ Determine active URL based on provider type
  const getActiveUrl = (): string => {
    if (!episodeDetail) return "";
    
    if (useDefaultUrl) {
      if (episodeDetail.defaultStreamingUrl) return episodeDetail.defaultStreamingUrl;
      if (episodeDetail.streamLinks && episodeDetail.streamLinks.length > 0) {
        return episodeDetail.streamLinks[selectedStreamLink]?.url || episodeDetail.streamLinks[0].url;
      }
      const firstServer = episodeDetail.server?.qualities
        ?.flatMap(q => q.serverList)
        ?.[0];
      if (firstServer && provider.serverFn) {
        if (!selectedServer) {
          setSelectedServer(firstServer);
          setUseDefaultUrl(false);
        }
      }
      return "";
    }
    
    return customEmbedUrl || "";
  };

  const activeUrl = getActiveUrl();
  const isLoading = isLoadingDetail || (!useDefaultUrl && isLoadingEmbed);
  const hasError = detailError || (!useDefaultUrl && embedError) || iframeError;

  // Gather all available servers (flatten qualities) - Samehadaku/Otakudesu
  const allServers: { quality: string; server: SankaServerItem }[] = [];
  episodeDetail?.server?.qualities?.forEach((q: SankaQualityGroup) => {
    if (q.serverList && q.serverList.length > 0) {
      q.serverList.forEach((s: SankaServerItem) => {
        allServers.push({ quality: q.title, server: s });
      });
    }
  });

  // Stream links (Stream API)
  const streamLinks = episodeDetail?.streamLinks || [];

  const handleSelectServer = (server: SankaServerItem) => {
    setSelectedServer(server);
    setUseDefaultUrl(false);
    setIframeError(false);
  };

  const handleSelectStreamLink = (index: number) => {
    setSelectedStreamLink(index);
    setUseDefaultUrl(true);
    setIframeError(false);
  };

  const handleUseDefault = () => {
    setSelectedServer(null);
    setSelectedStreamLink(0);
    setUseDefaultUrl(true);
    setIframeError(false);
  };

  // Try next available server automatically
  const handleTryNextServer = () => {
    setIframeError(false);
    if (streamLinks.length > 1) {
      const nextIdx = (selectedStreamLink + 1) % streamLinks.length;
      setSelectedStreamLink(nextIdx);
      setUseDefaultUrl(true);
    } else if (allServers.length > 0) {
      const currentIdx = allServers.findIndex(s => s.server.serverId === selectedServer?.serverId);
      const nextIdx = (currentIdx + 1) % allServers.length;
      handleSelectServer(allServers[nextIdx].server);
    }
  };

  const providerLabel = provider.name;
  const providerEmoji = provider.emoji;

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            className="!px-3 !bg-[var(--color-surface-2)] border-0 hover:!bg-purple-500 hover:text-white transition-colors flex-shrink-0"
          >
            Kembali
          </Button>
          <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />
          <p className="text-sm font-bold text-purple-400 truncate flex-1">
            {episodeDetail?.title || `Episode ${episode.title}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Prev/Next Episode Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevEpisode && onSelectEpisode(prevEpisode)}
              disabled={!prevEpisode}
              className="p-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Episode Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => nextEpisode && onSelectEpisode(nextEpisode)}
              disabled={!nextEpisode}
              className="p-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Episode Selanjutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div 
            className="shrink-0 flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border"
            style={{ 
              backgroundColor: `${provider.color}15`, 
              color: provider.color,
              borderColor: `${provider.color}30` 
            }}
          >
            <span>{providerEmoji}</span>
            {providerLabel}
          </div>
        </div>
      </div>

      {/* Main Video Frame — Native fullscreen via allowFullScreen */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 group-hover:duration-300"></div>
        
        <div className="relative bg-black overflow-hidden shadow-2xl flex items-center justify-center w-full aspect-video rounded-2xl border border-white/10 ring-1 ring-white/5">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 space-y-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-xs font-semibold text-purple-300 tracking-[0.2em] uppercase animate-pulse">
                Menghubungkan ke {providerLabel}...
              </p>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-10 space-y-3 px-5 text-center">
              <div className="p-3 rounded-full bg-red-500/10 mb-1">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm font-bold text-white">Video Gagal Dimuat</p>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                {provider.name} tidak bisa memutar episode ini.
              </p>
              <div className="flex gap-2 mt-1 flex-wrap justify-center">
                <button
                  onClick={handleTryNextServer}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  🔄 Coba Server Lain
                </button>
                <button
                  onClick={() => { setIframeError(false); }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                >
                  ↺ Muat Ulang
                </button>
              </div>
              {/* Switch Provider Buttons */}
              {onSwitchProvider && (
                <div className="w-full pt-2 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Ganti Provider Streaming</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {PROVIDERS_CONFIG.filter(p => p.key !== provider.key).map(p => (
                      <button
                        key={p.key}
                        onClick={() => onSwitchProvider(p.key)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${p.color}15`,
                          borderColor: `${p.color}30`,
                          color: p.color,
                        }}
                      >
                        {p.emoji} {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeUrl && !isLoading && !hasError && (
            <>
              {activeUrl.includes(".m3u8") || activeUrl.endsWith(".mp4") ? (
                <CustomVideoPlayer 
                  src={activeUrl}
                  poster={coverImage || ""}
                  onTimeUpdate={(time, duration) => {
                    // Capped tracking updates every 5 seconds to avoid localStorage spam
                    if (Math.floor(time) % 5 === 0) {
                      updateWatchProgress(animeId, episode.episodeId, time, duration);
                    }
                  }}
                  onError={() => setIframeError(true)}
                  initialTime={0} // Could implement fetching initial time from getWatchHistory if desired
                />
              ) : (
                <iframe 
                  src={activeUrl} 
                  allowFullScreen 
                  allow="autoplay; fullscreen; encrypted-media; screen-wake-lock"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
                  className="w-full h-full border-none bg-black"
                  title={`${providerLabel} Video Player`}
                  onError={() => setIframeError(true)}
                />
              )}
              
              {/* Skip Intro Button */}
              {showSkipIntro && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => { setShowSkipIntro(false); if (skipTimerId) clearTimeout(skipTimerId); }}
                  className="absolute bottom-[4.5rem] right-4 z-30 px-5 py-2.5 bg-white/90 hover:bg-white text-black rounded-lg text-sm font-bold shadow-xl backdrop-blur-sm transition-all hover:scale-105"
                >
                  Skip Intro ⏭️
                </motion.button>
              )}
            </>
          )}

          {!activeUrl && !isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-10 space-y-3 px-5 text-center">
              <div className="p-3 rounded-full bg-yellow-500/10 mb-1">
                <Wifi className="w-7 h-7 text-yellow-500" />
              </div>
              <p className="text-sm font-bold text-white">Streaming Tidak Tersedia</p>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Episode ini belum ada link di {provider.name}. Coba ganti provider atau gunakan tab &quot;Smart Redirect&quot;.
              </p>
              {onSwitchProvider && (
                <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                  {PROVIDERS_CONFIG.filter(p => p.key !== provider.key).map(p => (
                    <button
                      key={p.key}
                      onClick={() => onSwitchProvider(p.key)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all hover:scale-105"
                      style={{
                        backgroundColor: `${p.color}15`,
                        borderColor: `${p.color}30`,
                        color: p.color,
                      }}
                    >
                      {p.emoji} {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auto-Play Next Episode Overlay */}
          {showAutoPlay && nextEpisode && !autoPlayCancelled && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-4"
            >
              <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-semibold">Episode Berikutnya</p>
              <p className="text-lg font-bold text-white">Eps {nextEpisode.title}</p>
              
              {/* Countdown Ring */}
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" strokeWidth="2" />
                  <circle 
                    cx="18" cy="18" r="15.9" fill="none" 
                    stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${(autoPlayCountdown / 5) * 100} 100`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">
                  {autoPlayCountdown}
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { if (nextEpisode) onSelectEpisode(nextEpisode); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-2"
                >
                  <Play size={14} fill="white" /> Putar Sekarang
                </button>
                <button
                  onClick={() => setAutoPlayCancelled(true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Under-Player Controls */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {nextEpisode && (
            <button
              onClick={() => nextEpisode && onSelectEpisode(nextEpisode)}
              className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <SkipForward size={14} /> Episode {nextEpisode.title} →
            </button>
          )}
          <button
            onClick={() => setIframeError(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"
            title="Klik jika video blank/tidak bisa diputar"
          >
            <AlertTriangle size={12} /> Video Error?
          </button>
        </div>
        
        {nextEpisode && (
          <button
            onClick={() => { setShowAutoPlay(true); setAutoPlayCountdown(5); setAutoPlayCancelled(false); }}
            className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 hover:text-purple-400 transition-colors px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] ml-auto"
          >
            <Timer size={12} /> Auto-play Berikutnya
          </button>
        )}
      </div>

      {/* Stream Link Selection (Stream API) */}
      {streamLinks.length > 1 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-blue-400" />
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">Pilih Server</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {streamLinks.map((link: { server: string; url: string }, idx: number) => (
              <button
                key={`${link.server}-${idx}`}
                onClick={() => handleSelectStreamLink(idx)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border ${
                  useDefaultUrl && selectedStreamLink === idx
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                    : "border-[var(--color-border)] hover:border-blue-500/30 bg-[var(--color-surface-2)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold ${
                    useDefaultUrl && selectedStreamLink === idx ? "text-blue-400" : ""
                  }`}>
                    {link.server}
                  </p>
                </div>
                {useDefaultUrl && selectedStreamLink === idx && (
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Server Quality Selection (Samehadaku/Otakudesu) */}
      {allServers.length > 0 && provider.serverFn && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">Pilih Server & Kualitas</span>
          </div>

          {/* Default (Google Blogger) Option — only for Samehadaku */}
          {episodeDetail?.defaultStreamingUrl && (
            <button
              onClick={handleUseDefault}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
                useDefaultUrl
                  ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/5"
                  : "border-[var(--color-border)] hover:border-green-500/30 bg-[var(--color-surface-2)]"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${useDefaultUrl ? "text-green-400" : "text-[var(--color-text)]"}`}>
                  ★ Default (Bebas Iklan)
                </p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Google Blogger — Tanpa iklan pop-up</p>
              </div>
              {useDefaultUrl && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
            </button>
          )}

          {/* Other Servers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allServers.map(({ quality, server }) => (
              <button
                key={server.serverId}
                onClick={() => handleSelectServer(server)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
                  !useDefaultUrl && selectedServer?.serverId === server.serverId
                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5"
                    : "border-[var(--color-border)] hover:border-purple-500/30 bg-[var(--color-surface-2)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold truncate ${
                    !useDefaultUrl && selectedServer?.serverId === server.serverId ? "text-purple-400" : ""
                  }`}>
                    {server.title}
                  </p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">{quality}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Alert */}
      <div className="flex bg-green-500/5 border border-green-500/10 p-4 rounded-2xl items-start gap-3">
        <div className="p-2 bg-green-500/10 rounded-full shrink-0">
          <CheckCircle2 size={14} className="text-green-500" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-green-500 mb-1">{providerEmoji} {providerLabel} — Sub Indo</h4>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-[1.6]">
            {provider.key === "samehadaku" 
              ? <>Menggunakan <strong>Google Blogger</strong> yang bersih dan bebas iklan pop-up.</>
              : provider.key === "stream"
              ? <>Menggunakan <strong>GDrive Player</strong> untuk streaming berkualitas.</>
              : <>Menggunakan embed pihak ketiga. Mungkin ada iklan pop-up.</>
            }
            {" "}Jika video gagal, gunakan tab <span className="font-semibold text-purple-400">Smart Redirect</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

interface EpisodeListProps {
  animeId: number;
  animeTitle: string;
  titleEnglish?: string;
  coverImage?: string;
  totalEpisodes?: number;
}

export function EpisodeList({ animeId, animeTitle, titleEnglish, coverImage, totalEpisodes }: EpisodeListProps) {
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [activeTab, setActiveTab] = useState<"inapp" | "redirect">("inapp");
  
  // Smart Redirect State
  const [selectedRedirectProvider, setSelectedRedirectProvider] = useState(0);
  
  // In-App Player State
  const [showAllEps, setShowAllEps] = useState(false);
  const [selectedEp, setSelectedEp] = useState<SankaEpisodeItem | null>(null);
  const [lastWatched, setLastWatched] = useState<WatchHistoryItem | null>(null);
  const [forcedProviderKey, setForcedProviderKey] = useState<ProviderKey | null>(null);
  const [manualMatchId, setManualMatchId] = useState<string | null>(null);
  const [showMatchPicker, setShowMatchPicker] = useState(false);

  // Load last watched episode
  useEffect(() => {
    if (animeId) setLastWatched(getLastWatchedEpisode(animeId));
  }, [animeId]);

  // Track episode plays in watch history
  const handleSelectEpisode = (ep: SankaEpisodeItem) => {
    setSelectedEp(ep);
    if (animeId && activeProvider) {
      addToWatchHistory({
        animeId,
        animeTitle,
        animeTitleEnglish: titleEnglish,
        coverImage: coverImage || "",
        episodeTitle: `Episode ${ep.title}`,
        episodeId: ep.episodeId,
        providerKey: activeProvider.key,
      });
      setLastWatched(getLastWatchedEpisode(animeId));
    }
  };

  // ★ Multi-Provider Search & Detail Fetch
  // When forcedProviderKey is set: only search that provider
  // Otherwise: auto-fallback through all providers
  const { data: providerResult, isLoading: isSearchLoading, isError: isSearchError } = useQuery({
    queryKey: ['multi_search_detail', animeTitle, titleEnglish, forcedProviderKey],
    queryFn: () => forcedProviderKey
      ? getAnimeDataFromProvider(forcedProviderKey, animeTitle, titleEnglish)
      : getAnimeDataWithFallback(animeTitle, titleEnglish),
    enabled: showEpisodes && activeTab === "inapp",
    retry: 0,
  });

  // When user picks a different anime from search results ("wrong anime" fix)
  const autoProvider = providerResult?.provider || PROVIDERS_CONFIG[0];
  const activeProvider = forcedProviderKey
    ? PROVIDERS_CONFIG.find(p => p.key === forcedProviderKey) || autoProvider
    : autoProvider;

  const { data: manualDetail, isLoading: isManualLoading } = useQuery({
    queryKey: ['manual_detail', activeProvider.key, manualMatchId],
    queryFn: () => loadAnimeDetailFromProvider(activeProvider.key as ProviderKey, manualMatchId!),
    enabled: !!manualMatchId,
    retry: 0,
  });

  const firstMatch = providerResult?.firstMatch;
  const allSearchResults: SankaSearchItem[] = providerResult?.searchResults || [];
  const animeDetails = manualDetail || providerResult?.animeDetail;

  const isLoadingInApp = isSearchLoading || isManualLoading;
  const isInAppFailed = isSearchError || (providerResult === null && !isSearchLoading);
  
  const episodes = animeDetails?.episodeList || [];
  const sortedEpisodes = [...episodes].reverse();
  const displayedEps = showAllEps ? sortedEpisodes : sortedEpisodes.slice(0, 24);

  // Auto-fallback to redirect when all providers fail
  useEffect(() => {
    if (showEpisodes && activeTab === "inapp" && !isLoadingInApp && isInAppFailed) {
      setActiveTab("redirect");
    }
  }, [showEpisodes, activeTab, isLoadingInApp, isInAppFailed]);

  const redirectProvider = REDIRECT_PROVIDERS[selectedRedirectProvider];
  const watchRedirect = () => {
    const url = redirectProvider.searchUrl(animeTitle);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Manual provider switch (from error overlay or provider tabs)
  const handleSwitchProvider = useCallback((providerKey: ProviderKey) => {
    setForcedProviderKey(providerKey);
    setManualMatchId(null);
    setShowMatchPicker(false);
    setSelectedEp(prev => prev); // Keep same episode, just change provider
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-bold flex items-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Tv size={18} className="text-[var(--color-primary)]" />
          Tonton Sekarang
        </h2>
        
        {/* TAB SWITCHER */}
        {showEpisodes && !selectedEp && (
          <div className="flex items-center bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab("inapp")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "inapp" ? "bg-purple-500 text-white shadow-sm" : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              In-App Player
            </button>
            <button
              onClick={() => setActiveTab("redirect")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "redirect" ? "bg-pink-500 text-white shadow-sm" : "text-[var(--color-text-muted)] hover:text-white"
              }`}
            >
              Smart Redirect
            </button>
          </div>
        )}
      </div>

      {/* IDLE STATE */}
      {!showEpisodes && (
        <div className="p-5 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
            <Play size={24} className="text-purple-400" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-semibold">Tonton Sub Indo Gratis</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              5 Provider: Samehadaku → Stream → Otakudesu → Oploverz → Winbu
            </p>
          </div>
          <Button onClick={() => setShowEpisodes(true)} icon={<MonitorPlay size={14} />} size="sm">
            Mulai Menonton
          </Button>
        </div>
      )}

      {showEpisodes && (
        <>
          {/* ======================= */}
          {/* IN-APP PLAYER TAB       */}
          {/* ======================= */}
          {activeTab === "inapp" && (
            <div className="animate-in fade-in duration-300">
              {selectedEp ? (
                <InAppPlayer 
                  episode={selectedEp} 
                  provider={activeProvider} 
                  onBack={() => setSelectedEp(null)}
                  allEpisodes={sortedEpisodes}
                  onSelectEpisode={handleSelectEpisode}
                  onSwitchProvider={handleSwitchProvider}
                  animeId={animeId}
                  coverImage={coverImage}
                />
              ) : (
                <div className="space-y-4">
                  {isLoadingInApp ? (
                    <div className="p-8 text-center space-y-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                      <Loader2 className="animate-spin text-purple-500 w-8 h-8 mx-auto" />
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        Mencari sumber Streaming (Multi-Provider)...
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        Samehadaku → Stream → Otakudesu → Oploverz → Winbu
                      </p>
                    </div>
                  ) : providerResult === null ? (
                    <div className="p-6 text-center space-y-2 bg-red-500/5 rounded-2xl border border-red-500/10">
                      <AlertTriangle className="w-8 h-8 mx-auto text-red-500/80" />
                      <p className="text-sm font-bold text-red-400">Anime tidak ditemukan di semua provider</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Semua 5 provider (Samehadaku, Stream, Otakudesu, Oploverz, Winbu) tidak menemukan anime ini.
                        Gunakan tab &quot;Smart Redirect&quot; untuk mencari di sumber lain.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* ── Manual Provider Selector Tabs ── */}
                      <div className="flex items-center gap-1.5 flex-wrap pb-1">
                        <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mr-0.5">Provider:</span>
                        {PROVIDERS_CONFIG.map(p => (
                          <button
                            key={p.key}
                            onClick={() => {
                              setForcedProviderKey(p.key as ProviderKey);
                              setManualMatchId(null);
                              setShowMatchPicker(false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all"
                            style={activeProvider.key === p.key
                              ? { backgroundColor: p.color, borderColor: p.color, color: '#fff' }
                              : { backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
                            }
                          >
                            {p.emoji} {p.name}
                          </button>
                        ))}
                      </div>

                      {/* Provider Badge + Matched title + "Bukan ini?" button */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                        style={{ backgroundColor: `${activeProvider.color}08`, borderColor: `${activeProvider.color}20` }}
                      >
                        <CheckCircle2 size={14} style={{ color: activeProvider.color }} className="flex-shrink-0" />
                        <p className="text-[11px] text-[var(--color-text-secondary)] flex-1 min-w-0">
                          <span className="font-bold" style={{ color: activeProvider.color }}>
                            {activeProvider.emoji} {activeProvider.name}
                          </span>
                          {" "}&mdash;{" "}
                          <span className="font-bold text-green-400 truncate">
                            {manualMatchId ? (animeDetails?.title || "Memuat...") : (firstMatch?.title || "Mencari...")}
                          </span>
                          {firstMatch?.type && !manualMatchId && <span className="text-[var(--color-text-muted)]"> ({firstMatch.type})</span>}
                        </p>
                        {allSearchResults.length > 1 && (
                          <button
                            onClick={() => setShowMatchPicker(v => !v)}
                            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/20 transition-all"
                          >
                            {showMatchPicker ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            Bukan ini?
                          </button>
                        )}
                      </div>

                      {/* Search Results Picker (anime selector) */}
                      <AnimatePresence>
                        {showMatchPicker && allSearchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-[var(--color-surface)] border border-orange-500/20 rounded-xl p-3 space-y-2">
                              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Pilih anime yang benar:</p>
                              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                {allSearchResults.map((result: SankaSearchItem) => (
                                  <button
                                    key={result.animeId}
                                    onClick={() => { setManualMatchId(result.animeId); setShowMatchPicker(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all border ${
                                      (manualMatchId === result.animeId || (!manualMatchId && result.animeId === firstMatch?.animeId))
                                        ? 'border-orange-500 bg-orange-500/10 text-orange-300 font-bold'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-orange-500/40'
                                    }`}
                                  >
                                    <span className="flex-1 truncate font-semibold">{result.title}</span>
                                    {result.type && (
                                      <span className="shrink-0 text-[9px] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">{result.type}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                              {manualMatchId && (
                                <button
                                  onClick={() => { setManualMatchId(null); setShowMatchPicker(false); }}
                                  className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-white transition-colors"
                                >
                                  <X size={10} /> Reset ke pilihan otomatis
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Episode Grid */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {displayedEps.map((ep) => {
                          const isLastWatched = lastWatched?.episodeId === ep.episodeId;
                          return (
                            <motion.button
                              key={ep.episodeId}
                              whileHover={{ scale: 1.06, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleSelectEpisode(ep)}
                              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all group cursor-pointer ${
                                isLastWatched
                                  ? "bg-purple-500/10 border-purple-500/30"
                                  : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:border-purple-500/50 hover:bg-purple-500/5"
                              }`}
                            >
                              {isLastWatched && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-[var(--color-bg)]" />
                              )}
                              <Play size={14} className={`transition-colors mb-1 ${isLastWatched ? "text-purple-400" : "text-[var(--color-text-muted)] group-hover:text-purple-400"}`} fill="currentColor" />
                              <span className={`text-xs font-bold transition-colors ${isLastWatched ? "text-purple-400" : "group-hover:text-purple-400"}`}>
                                Eps {ep.title}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {episodes.length > 24 && (
                        <button
                          onClick={() => setShowAllEps(!showAllEps)}
                          className="w-full py-2.5 text-xs font-semibold text-purple-400 hover:underline"
                        >
                          {showAllEps ? "Sembunyikan" : `Tampilkan semua ${episodes.length} episode`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================= */}
          {/* SMART REDIRECT TAB      */}
          {/* ======================= */}
          {activeTab === "redirect" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Pencarian Provider (Buka Tab Baru):
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REDIRECT_PROVIDERS.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedRedirectProvider(i)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border ${
                        selectedRedirectProvider === i
                          ? "border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/5"
                          : "border-[var(--color-border)] hover:border-pink-500/30 bg-[var(--color-surface-2)]"
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${
                          selectedRedirectProvider === i ? "text-pink-400" : ""
                        }`}>
                          {p.name}
                        </p>
                        <p className="text-[9px] text-[var(--color-text-muted)] truncate">
                          {p.description}
                        </p>
                      </div>
                      {selectedRedirectProvider === i && (
                        <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={watchRedirect} className="w-full" icon={<Search size={16} />}>
                Cari &quot;{animeTitle}&quot; di {redirectProvider.name}
              </Button>
            </div>
          )}

          <p className="text-[9px] text-center text-[var(--color-text-muted)] leading-relaxed mt-4">
            AniVerse hanya menampilkan informasi anime dari AniList/MyAnimeList.<br />
            Streaming disediakan oleh Samehadaku / Stream Indo / Otakudesu via Sanka Vollerei API.
          </p>
        </>
      )}
    </div>
  );
}
