import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react';
import { requestSpeechAudio, TtsVoiceName } from '../../services/aiClient';
import { prepareTextForSpeech } from '../../utils/studyFormatters';

export const TTS_VOICES: Array<{ value: TtsVoiceName; label: string }> = [
  { value: 'Kore', label: 'Kore (Clear)' },
  { value: 'Zephyr', label: 'Zephyr (Warm)' },
  { value: 'Puck', label: 'Puck (Bright)' },
  { value: 'Charon', label: 'Charon (Deep)' },
  { value: 'Fenrir', label: 'Fenrir (Crisp)' },
];

export const TTS_RATES = [0.85, 1, 1.25, 1.5] as const;

function base64ToObjectUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType || 'audio/wav' });
  return URL.createObjectURL(blob);
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const rem = total % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export interface TtsTarget {
  id: string;
  text: string;
  contextLabel?: string;
}

export function useTtsPlayer() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [voiceName, setVoiceName] = useState<TtsVoiceName>('Kore');
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const requestSeqRef = useRef(0);
  const rateRef = useRef(playbackRate);
  rateRef.current = playbackRate;

  const stopAudioElement = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const stop = useCallback(() => {
    requestSeqRef.current += 1;
    stopAudioElement();
    setActiveId(null);
    setLoadingId(null);
  }, [stopAudioElement]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, []);

  const loadAndPlayUrl = useCallback(
    async (id: string, objectUrl: string) => {
      stopAudioElement();
      const audio = new Audio(objectUrl);
      audio.playbackRate = rateRef.current;
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        if (audioRef.current === audio) {
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        }
      });
      audio.addEventListener('timeupdate', () => {
        if (audioRef.current === audio) {
          setCurrentTime(audio.currentTime);
        }
      });
      audio.addEventListener('ended', () => {
        if (audioRef.current === audio) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      });
      audio.addEventListener('error', () => {
        if (audioRef.current === audio) {
          setIsPlaying(false);
          setError('Audio playback failed in this browser.');
        }
      });

      setActiveId(id);
      await audio.play();
      setIsPlaying(true);
    },
    [stopAudioElement]
  );

  const startPlayback = useCallback(
    async (target: TtsTarget, chosenVoice: TtsVoiceName) => {
      const cleaned = prepareTextForSpeech(target.text);
      if (!cleaned) {
        setError('There is no readable text in this item.');
        return;
      }

      const cacheKey = `${target.id}::${chosenVoice}`;
      const cachedUrl = cacheRef.current.get(cacheKey);
      setError(null);

      if (cachedUrl) {
        try {
          await loadAndPlayUrl(target.id, cachedUrl);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to start audio playback.');
        }
        return;
      }

      const seq = ++requestSeqRef.current;
      stopAudioElement();
      setActiveId(null);
      setLoadingId(target.id);

      try {
        const result = await requestSpeechAudio({
          text: cleaned,
          voiceName: chosenVoice,
          contextLabel: target.contextLabel,
        });

        if (requestSeqRef.current !== seq) return;

        const objectUrl = base64ToObjectUrl(result.audioBase64, result.mimeType);
        cacheRef.current.set(cacheKey, objectUrl);
        setLoadingId(null);
        await loadAndPlayUrl(target.id, objectUrl);
      } catch (err) {
        if (requestSeqRef.current !== seq) return;
        setLoadingId(null);
        setError(err instanceof Error ? err.message : 'Failed to generate speech audio.');
      }
    },
    [loadAndPlayUrl, stopAudioElement]
  );

  const toggleListen = useCallback(
    async (target: TtsTarget) => {
      if (loadingId === target.id) {
        stop();
        return;
      }

      if (activeId === target.id && audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to resume audio playback.');
          }
        }
        return;
      }

      await startPlayback(target, voiceName);
    },
    [activeId, isPlaying, loadingId, startPlayback, stop, voiceName]
  );

  const changeVoice = useCallback(
    async (nextVoice: TtsVoiceName, activeTarget?: TtsTarget) => {
      setVoiceName(nextVoice);
      if (activeTarget && activeId === activeTarget.id) {
        await startPlayback(activeTarget, nextVoice);
      }
    },
    [activeId, startPlayback]
  );

  const changeRate = useCallback((nextRate: number) => {
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  return {
    activeId,
    loadingId,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    voiceName,
    error,
    clearError: () => setError(null),
    toggleListen,
    changeVoice,
    changeRate,
    seek,
    stop,
  };
}

interface TtsAudioBarProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  voiceName: TtsVoiceName;
  label?: string;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (seconds: number) => void;
  onChangeRate: (rate: number) => void;
  onChangeVoice: (voice: TtsVoiceName) => void;
}

export const TtsAudioBar: React.FC<TtsAudioBarProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  playbackRate,
  voiceName,
  label,
  onTogglePlay,
  onStop,
  onSeek,
  onChangeRate,
  onChangeVoice,
}) => {
  const safeDuration = duration > 0 ? duration : 0;

  return (
    <div
      role="region"
      aria-label="Study audio playback controls"
      className="rounded-xl bg-[var(--bg-subtle)]/75 border border-[var(--border-color)] px-3.5 py-2.5 flex flex-wrap items-center gap-3"
    >
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause study audio' : 'Play study audio'}
        className="w-8 h-8 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] flex items-center justify-center shrink-0 disabled:opacity-60 cursor-pointer transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-[160px] space-y-1">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-main)] truncate">
            <Volume2 className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
            <span className="truncate">
              {isLoading ? 'Generating audio with Gemini TTS...' : label || 'Gemini Study Audio'}
            </span>
          </span>
          <span className="font-mono tabular-nums text-[var(--text-muted)] shrink-0">
            {formatSeconds(currentTime)} / {formatSeconds(safeDuration)}
          </span>
        </div>
        <input
          type="range"
          aria-label="Seek audio position"
          min={0}
          max={safeDuration || 1}
          step={0.1}
          value={Math.min(currentTime, safeDuration || 1)}
          disabled={isLoading || safeDuration === 0}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1.5 accent-[var(--color-primary)] cursor-pointer disabled:opacity-40"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          aria-label="Select narrator voice"
          value={voiceName}
          disabled={isLoading}
          onChange={(e) => onChangeVoice(e.target.value as TtsVoiceName)}
          className="px-2 py-1 text-[11px] font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {TTS_VOICES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Playback speed"
          value={playbackRate}
          onChange={(e) => onChangeRate(Number(e.target.value))}
          className="px-2 py-1 text-[11px] font-mono tabular-nums font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {TTS_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onStop}
          aria-label="Stop and close audio player"
          title="Stop playback"
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)] transition-colors cursor-pointer"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
