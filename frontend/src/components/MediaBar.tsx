/**
 * MediaBar - Persistent Media Control Deck
 *
 * Sits at the bottom of the app, provides continuous audio/video engagement
 * Mimics professional audio software (DAW) paradigm
 */
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";

export const MediaBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTrack] = useState({
    title: "Halilit Catalog Browser",
    artist: "Ambient Exploration",
  });

  return (
    <div className="w-full h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between px-6 gap-4">
      {/* Left: Track Info */}
      <div className="min-w-0 flex-1 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-white/10 flex items-center justify-center shrink-0">
          <Music size={18} className="text-indigo-400" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">
            {currentTrack.title}
          </div>
          <div className="text-[10px] text-white/50 truncate">
            {currentTrack.artist}
          </div>
        </div>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-4">
        <button
          className="text-white/40 hover:text-white transition-colors"
          title="Previous"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-lg"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          className="text-white/40 hover:text-white transition-colors"
          title="Next"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Right: Volume Control */}
      <div className="flex items-center gap-2">
        <Volume2 size={16} className="text-white/40 shrink-0" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-600"
          title="Volume"
        />
        <span className="text-xs text-white/40 w-8 text-right">{volume}%</span>
      </div>
    </div>
  );
};
