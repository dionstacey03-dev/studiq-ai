import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function joinDictatedSegments(base: string, spoken: string): string {
  const cleanSpoken = spoken.trim();
  if (!cleanSpoken) return base;
  if (!base.trim()) return cleanSpoken;
  const needsSpace = !/[\s\n]$/.test(base);
  return `${base}${needsSpace ? ' ' : ''}${cleanSpoken}`;
}

export function useSpeechDictation(options: {
  onTranscriptChange: (nextText: string) => void;
}) {
  const { onTranscriptChange } = options;
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef('');
  const finalTranscriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscriptChange);
  onTranscriptRef.current = onTranscriptChange;

  const isSupported = Boolean(getSpeechRecognitionCtor());

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore if already stopped
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const start = useCallback((currentInputText: string) => {
    setError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError(
        'Voice dictation is not supported in this browser. Try Chrome, Edge, or Safari with SpeechRecognition enabled.'
      );
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    baseTextRef.current = currentInputText;
    finalTranscriptRef.current = '';
    setInterimText('');

    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalized = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalized += (finalized ? ' ' : '') + text.trim();
          } else {
            interim += (interim ? ' ' : '') + text.trim();
          }
        }

        finalTranscriptRef.current = finalized;
        setInterimText(interim);

        const spoken = [finalized, interim].filter(Boolean).join(' ');
        onTranscriptRef.current(joinDictatedSegments(baseTextRef.current, spoken));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'aborted') {
          setIsListening(false);
          setInterimText('');
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(
            'Microphone access was denied. Please allow microphone permissions in your browser and try again.'
          );
        } else if (event.error === 'audio-capture') {
          setError('No microphone device was detected. Please connect a microphone and try again.');
        } else if (event.error === 'no-speech') {
          setError('No speech was detected. Please speak clearly toward your microphone.');
        } else if (event.error === 'network') {
          setError('Speech recognition requires an active network connection in this browser.');
        } else {
          setError(`Voice dictation stopped (${event.error || 'unknown error'}).`);
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Could not start voice dictation. Check microphone permissions and try again.');
      setIsListening(false);
    }
  }, []);

  const toggle = useCallback(
    (currentInputText: string) => {
      if (isListening) {
        stop();
      } else {
        start(currentInputText);
      }
    },
    [isListening, start, stop]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    clearError: () => setError(null),
    start,
    stop,
    toggle,
  };
}
