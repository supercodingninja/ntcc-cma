import { supabase } from '../lib/supabase';
import { speak } from '../utils/text-to-speech';

export class JPAIService {
  constructor() {
    this.wakePhrases = ['jp my guy', 'jp', 'hey jp'];
  }

  isWakePhrase(text) {
    const normalizedText = text.toLowerCase().trim();
    return this.wakePhrases.some(phrase => normalizedText.includes(phrase));
  }

  async processCommand(transcript, currentUserId) {
    const command = transcript.toLowerCase();

    if (command.includes('assign') || command.includes('give') || command.includes('task')) {
      return await this.handleAssignTask(transcript, currentUserId);
    }

    if (command.includes('check') || command.includes('status')) {
      return await this.handleCheckStatus(transcript, currentUserId);
    }

    if (command.includes('cancel') || command.includes('close') || command.includes('stop')) {
      return { action: 'close', message: 'Closing JP assistant' };
    }

    return { action: 'unknown', message: 'I didn\'t understand that command. Try saying "assign task" or "check status"' };
  }

  async handleAssignTask(transcript, currentUserId) {
    const { data: users } = await supabase
      .from('users_profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'editor']);

    const userName = this.extractUserName(transcript, users);
    const taskDescription = this.extractTaskDescription(transcript);

    if (!userName || !taskDescription) {
      speak('I need both a person\'s name and a task description');
      return {
        action: 'error',
        message: 'Please specify who to assign the task to and what the task is'
      };
    }

    const targetUser = users.find(u =>
      u.full_name?.toLowerCase().includes(userName.toLowerCase()) ||
      u.email?.toLowerCase().includes(userName.toLowerCase())
    );

    if (!targetUser) {
      speak(`I couldn't find a user named ${userName}`);
      return { action: 'error', message: `User ${userName} not found` };
    }

    const { error } = await supabase
      .from('admin_tasks')
      .insert({
        created_by: currentUserId,
        assigned_to: targetUser.id,
        task_type: 'manual',
        description: taskDescription,
        status: 'pending',
        estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      speak('There was an error assigning the task');
      return { action: 'error', message: error.message };
    }

    speak(`Task assigned to ${targetUser.full_name}`);
    return {
      action: 'assigned',
      message: `Task assigned to ${targetUser.full_name}: ${taskDescription}`
    };
  }

  async handleCheckStatus(transcript, currentUserId) {
    const { data: tasks } = await supabase
      .from('admin_tasks')
      .select(`
        *,
        assigned_user:assigned_to(full_name)
      `)
      .eq('created_by', currentUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!tasks || tasks.length === 0) {
      speak('You have no active tasks');
      return { action: 'status', tasks: [] };
    }

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    speak(`You have ${pendingCount} pending tasks and ${completedCount} completed tasks`);
    return { action: 'status', tasks, pendingCount, completedCount };
  }

  extractUserName(transcript, users) {
    const words = transcript.toLowerCase().split(' ');
    for (const user of users) {
      const nameParts = user.full_name?.toLowerCase().split(' ') || [];
      for (const part of nameParts) {
        if (words.includes(part)) {
          return user.full_name;
        }
      }
    }
    return null;
  }

  extractTaskDescription(transcript) {
    const taskIndicators = ['to', 'task', 'assign', 'give'];
    const words = transcript.split(' ');
    let startIndex = -1;

    for (let i = 0; i < words.length; i++) {
      if (taskIndicators.some(indicator => words[i].toLowerCase().includes(indicator))) {
        startIndex = i + 1;
        break;
      }
    }

    if (startIndex === -1 || startIndex >= words.length) {
      return null;
    }

    return words.slice(startIndex).join(' ');
  }
}
