import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { MUSIC_TRACKS, TRANSLATIONS } from '../../constants';
import { Play, Pause, SkipBack, SkipForward, Music, Volume2 } from 'lucide-react';

interface MusicPlayerProps extends AppProps {
    volume?: number;
}

const MusicPlayerApp: React.FC<MusicPlayerProps> = ({ lang, volume = 0.5 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = (key: string) => TRANSLATIONS[key][lang];

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % MUSIC_TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-[#111] text-nird-green flex flex-col p-4 overflow-hidden relative">
      {/* Retro Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <audio
        ref={audioRef}
        src={MUSIC_TRACKS[currentTrack].src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Header / Title */}
      <div className="text-center mb-6 z-10">
        <h2 className="text-xs text-nird-green/60 uppercase tracking-widest mb-1">{t('music.nowplaying')}</h2>
        <div className="text-xl font-bold text-white animate-pulse-slow">
          {MUSIC_TRACKS[currentTrack].title}
        </div>
        <div className="text-sm text-nird-green">
          {MUSIC_TRACKS[currentTrack].artist}
        </div>
      </div>

      {/* Visualization (Fake) */}
      <div className="flex-1 flex items-end justify-center gap-1 mb-6 px-8">
        {[...Array(16)].map((_, i) => (
          <div 
            key={i} 
            className="w-3 bg-nird-green/80 rounded-t-sm transition-all duration-100 ease-linear"
            style={{ 
              height: isPlaying ? `${Math.max(10, Math.random() * 100)}%` : '10%',
              opacity: 0.6 + (i % 2) * 0.4 
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4 z-10">
        <div className="flex justify-between text-xs font-mono text-nird-green/70 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-nird-green transition-all duration-200 ease-linear"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-6 z-10">
        <button onClick={prevTrack} className="p-2 hover:text-white transition-colors">
          <SkipBack size={24} />
        </button>
        
        <button 
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-nird-green text-black flex items-center justify-center hover:bg-white transition-all hover:scale-105 shadow-[0_0_15px_rgba(0,255,65,0.4)]"
        >
          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
        </button>

        <button onClick={nextTrack} className="p-2 hover:text-white transition-colors">
          <SkipForward size={24} />
        </button>
      </div>

      {/* Playlist Mini View */}
      <div className="mt-6 border-t border-gray-800 pt-4 z-10 overflow-y-auto max-h-[100px] text-xs font-mono">
        <div className="text-gray-500 mb-2 uppercase">{t('music.playlist')}</div>
        {MUSIC_TRACKS.map((track, i) => (
          <div 
            key={i}
            onClick={() => { setCurrentTrack(i); setIsPlaying(true); }}
            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-white/5 ${currentTrack === i ? 'text-nird-green font-bold bg-white/10' : 'text-gray-400'}`}
          >
            <span className="w-4 text-center">{currentTrack === i ? '▶' : i + 1}</span>
            <span className="truncate">{track.title} - {track.artist}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicPlayerApp;