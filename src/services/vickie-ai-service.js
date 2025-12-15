import { speak } from '../utils/text-to-speech';
import { musicKnowledgeBase, findAnswer } from '../data/music-knowledge-base';

export class VickieAIService {
  constructor() {
    this.knowledgeBase = musicKnowledgeBase;
  }

  async processQuestion(question) {
    const q = question.toLowerCase();

    if (this.isMusicTheoryQuestion(q)) {
      return this.answerMusicTheory(q);
    }

    if (this.isSheetMusicQuestion(q)) {
      return this.helpWithSheetMusic(q);
    }

    if (this.isAppNavigationQuestion(q)) {
      return this.guideAppUsage(q);
    }

    return {
      type: 'general',
      message: 'I can help you with music theory, reading sheet music, or navigating the app. What would you like to know?'
    };
  }

  isMusicTheoryQuestion(q) {
    const theoryKeywords = ['what is', 'explain', 'define', 'scale', 'chord', 'note', 'sharp', 'flat', 'clef', 'time signature', 'rest', 'interval', 'tempo', 'dynamic', 'key signature'];
    return theoryKeywords.some(keyword => q.includes(keyword));
  }

  isSheetMusicQuestion(q) {
    const sheetKeywords = ['read', 'sheet', 'notation', 'staff', 'how to play', 'notes in'];
    return sheetKeywords.some(keyword => q.includes(keyword));
  }

  isAppNavigationQuestion(q) {
    const navKeywords = ['how do i', 'where is', 'how to use', 'find', 'navigate', 'feature'];
    return navKeywords.some(keyword => q.includes(keyword));
  }

  answerMusicTheory(question) {
    const answer = findAnswer(question);

    if (answer) {
      speak(answer);
      return {
        type: 'theory',
        message: answer
      };
    }

    const generalAnswer = 'I can explain music concepts like scales, chords, notes, intervals, rhythm, harmony, and much more! I also know about instruments, how to count in different time signatures, and practice techniques. What would you like to learn about?';
    speak(generalAnswer);
    return {
      type: 'theory',
      message: generalAnswer
    };
  }

  helpWithSheetMusic(question) {
    const response = 'To read sheet music, start by identifying the clef (treble or bass), then look at the key signature to see which notes are sharp or flat. Each note on the staff corresponds to a specific pitch. The time signature tells you how many beats are in each measure. Would you like me to explain any specific notation?';
    speak(response);
    return {
      type: 'sheet_music',
      message: response
    };
  }

  guideAppUsage(question) {
    if (question.includes('task') || question.includes('jp')) {
      const response = 'For task management, admins can activate JP by saying "JP, my guy". JP can assign tasks and check their status using voice commands.';
      speak(response);
      return { type: 'navigation', message: response };
    }

    if (question.includes('design') || question.includes('tanya')) {
      const response = 'For design changes, admins can use Tanya by clicking the Design button. Tanya allows drag-and-drop styling changes.';
      speak(response);
      return { type: 'navigation', message: response };
    }

    if (question.includes('song') || question.includes('add') || question.includes('edit')) {
      const response = 'To manage songs, go to the Songs page. Admins and editors can add new songs or edit existing ones. You can upload sheet music, audio files, and YouTube links.';
      speak(response);
      return { type: 'navigation', message: response };
    }

    if (question.includes('practice')) {
      const response = 'The Practice page has a chromatic tuner to help you tune your instrument, and you can upload and view sheet music files including PDFs and Sibelius files.';
      speak(response);
      return { type: 'navigation', message: response };
    }

    const response = 'I can help you navigate the app! Try asking about songs, practice tools, tasks, or design features.';
    speak(response);
    return { type: 'navigation', message: response };
  }
}
