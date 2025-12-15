export const speak = (text, options = {}) => {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech not supported');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.95;
  utterance.pitch = options.pitch || 1.05;
  utterance.volume = options.volume || 1.0;
  utterance.lang = options.lang || 'en-US';

  if (options.voice) {
    utterance.voice = options.voice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Fiona',
      'Microsoft Aria',
      'Google UK English Female'
    ];

    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name.includes(voiceName) && v.lang.includes('en'));
      if (voice) {
        utterance.voice = voice;
        break;
      }
    }

    if (!utterance.voice) {
      const femaleVoice = voices.find(v =>
        v.lang.includes('en') &&
        (v.name.toLowerCase().includes('female') ||
         v.name.toLowerCase().includes('woman') ||
         v.name.includes('Zira') ||
         v.name.includes('Samantha'))
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const getVoices = () => {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};
