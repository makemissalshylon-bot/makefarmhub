/**
 * Voice Search Service
 * Speech-to-text for accessibility
 */

export const voiceSearchService = {
  recognition: null as any,
  isListening: false,

  /**
   * Initialize speech recognition
   */
  init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-ZW';

    return true;
  },

  /**
   * Start listening
   */
  startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition && !this.init()) {
      onError?.('Voice search not supported in this browser');
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error: any) {
      console.error('Failed to start voice recognition:', error);
      onError?.(error.message);
      this.isListening = false;
    }
  },

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  },

  /**
   * Check if listening
   */
  getIsListening(): boolean {
    return this.isListening;
  },

  /**
   * Set language
   */
  setLanguage(lang: 'en' | 'sn' | 'nd') {
    if (this.recognition) {
      const langCodes = { en: 'en-ZW', sn: 'sn-ZW', nd: 'nd-ZW' };
      this.recognition.lang = langCodes[lang];
    }
  },
};
