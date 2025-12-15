import { supabase } from '../lib/supabase';

class PracticeSessionService {
  constructor() {
    this.currentSession = null;
    this.sessionStartTime = null;
    this.practiceTimer = null;
    this.elapsedSeconds = 0;
    this.onTimerUpdate = null;
    this.sectionsLogged = [];
    this.toolsUsed = new Set();
  }

  async startSession(options = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    this.sessionStartTime = new Date();
    this.elapsedSeconds = 0;
    this.sectionsLogged = [];
    this.toolsUsed = new Set();

    const { data, error } = await supabase
      .from('advanced_practice_sessions')
      .insert({
        user_id: user.id,
        sheet_music_id: options.sheetMusicId || null,
        song_id: options.songId || null,
        started_at: this.sessionStartTime.toISOString(),
        tempo_practiced: options.tempo || 120,
        notes: options.notes || '',
        mood: options.mood || null,
        energy_level: options.energyLevel || null
      })
      .select()
      .single();

    if (error) throw error;
    this.currentSession = data;

    this.startTimer();
    return this.currentSession;
  }

  startTimer() {
    if (this.practiceTimer) clearInterval(this.practiceTimer);

    this.practiceTimer = setInterval(() => {
      this.elapsedSeconds++;
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.elapsedSeconds);
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.practiceTimer) {
      clearInterval(this.practiceTimer);
      this.practiceTimer = null;
    }
  }

  resumeTimer() {
    if (!this.practiceTimer && this.currentSession) {
      this.startTimer();
    }
  }

  logTool(toolName) {
    this.toolsUsed.add(toolName);
  }

  logSection(startMeasure, endMeasure, repetitions = 1) {
    this.sectionsLogged.push({
      start_measure: startMeasure,
      end_measure: endMeasure,
      repetitions,
      logged_at: new Date().toISOString()
    });
  }

  async endSession(options = {}) {
    if (!this.currentSession) return null;

    this.pauseTimer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('advanced_practice_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: this.elapsedSeconds,
        sections_practiced: this.sectionsLogged,
        notes: options.notes || this.currentSession.notes,
        mood: options.mood || this.currentSession.mood,
        energy_level: options.energyLevel || this.currentSession.energy_level,
        focus_score: options.focusScore || null,
        tools_used: Array.from(this.toolsUsed)
      })
      .eq('id', this.currentSession.id)
      .select()
      .single();

    if (error) throw error;

    await this.updateGoalProgress(this.elapsedSeconds);

    const session = this.currentSession;
    this.currentSession = null;
    this.sessionStartTime = null;
    this.elapsedSeconds = 0;
    this.sectionsLogged = [];
    this.toolsUsed.clear();

    return data || session;
  }

  async updateGoalProgress(secondsPracticed) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: goals } = await supabase
      .from('practice_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .in('goal_type', ['daily_time', 'weekly_time']);

    if (!goals) return;

    for (const goal of goals) {
      const newValue = goal.current_value + Math.floor(secondsPracticed / 60);
      const completed = newValue >= goal.target_value;

      await supabase
        .from('practice_goals')
        .update({
          current_value: newValue,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          streak_count: completed ? goal.streak_count + 1 : goal.streak_count
        })
        .eq('id', goal.id);
    }
  }

  async saveRecording(recordingBlob, options = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('practice_recordings')
      .insert({
        user_id: user.id,
        session_id: this.currentSession?.id || null,
        sheet_music_id: options.sheetMusicId || null,
        duration_seconds: options.duration || 0,
        start_measure: options.startMeasure || null,
        end_measure: options.endMeasure || null,
        tempo: options.tempo || null,
        pitch_accuracy: options.pitchAccuracy || null,
        rhythm_accuracy: options.rhythmAccuracy || null,
        overall_score: options.overallScore || null,
        waveform_data: options.waveformData || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionHistory(limit = 30) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('advanced_practice_sessions')
      .select('*, sheet_music(title, composer), songs(title, artist)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getPracticeStats(days = 30) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions } = await supabase
      .from('advanced_practice_sessions')
      .select('duration_seconds, started_at, mood, focus_score')
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString());

    if (!sessions || sessions.length === 0) return {
      totalMinutes: 0,
      sessionCount: 0,
      avgSessionLength: 0,
      longestSession: 0,
      practiceStreak: 0,
      dailyBreakdown: []
    };

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const longestSession = Math.max(...sessions.map(s => s.duration_seconds || 0));

    const dailyMap = new Map();
    sessions.forEach(session => {
      const date = new Date(session.started_at).toLocaleDateString();
      const existing = dailyMap.get(date) || 0;
      dailyMap.set(date, existing + (session.duration_seconds || 0));
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toLocaleDateString();
      if (dailyMap.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalMinutes: Math.floor(totalSeconds / 60),
      sessionCount: sessions.length,
      avgSessionLength: Math.floor(totalSeconds / sessions.length / 60),
      longestSession: Math.floor(longestSession / 60),
      practiceStreak: streak,
      dailyBreakdown: Array.from(dailyMap.entries()).map(([date, seconds]) => ({
        date,
        minutes: Math.floor(seconds / 60)
      }))
    };
  }

  async getGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('practice_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createGoal(goal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('practice_goals')
      .insert({
        user_id: user.id,
        ...goal
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoal(goalId) {
    const { error } = await supabase
      .from('practice_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  }

  async saveAnnotation(annotation) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('music_annotations')
      .insert({
        user_id: user.id,
        ...annotation
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAnnotations(sheetMusicId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('music_annotations')
      .select('*')
      .eq('sheet_music_id', sheetMusicId)
      .eq('user_id', user.id)
      .order('measure_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async deleteAnnotation(annotationId) {
    const { error } = await supabase
      .from('music_annotations')
      .delete()
      .eq('id', annotationId);

    if (error) throw error;
  }

  async getPreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('practice_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async savePreferences(preferences) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('practice_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getElapsedTime() {
    return this.elapsedSeconds;
  }

  isSessionActive() {
    return this.currentSession !== null;
  }
}

export const practiceSession = new PracticeSessionService();
export default practiceSession;
