import { speak } from '../utils/text-to-speech';

export class TanyaAIService {
  constructor() {
    this.changes = [];
  }

  processCommand(transcript) {
    const command = transcript.toLowerCase();

    if (command.includes('bigger') || command.includes('larger') || command.includes('increase size')) {
      return { action: 'resize', value: 'larger', message: 'Making element larger' };
    }

    if (command.includes('smaller') || command.includes('decrease size')) {
      return { action: 'resize', value: 'smaller', message: 'Making element smaller' };
    }

    if (command.includes('color') || command.includes('change color')) {
      const color = this.extractColor(command);
      return { action: 'color', value: color, message: `Changing color to ${color}` };
    }

    if (command.includes('move') || command.includes('position')) {
      return { action: 'position', message: 'Drag the element to reposition it' };
    }

    if (command.includes('save draft')) {
      return this.saveDraft();
    }

    if (command.includes('apply') || command.includes('save changes')) {
      return this.applyChanges();
    }

    if (command.includes('cancel') || command.includes('close')) {
      return { action: 'close', message: 'Closing design tool' };
    }

    return { action: 'unknown', message: 'Try saying "make it bigger", "change color", or "save draft"' };
  }

  extractColor(command) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'gray'];
    for (const color of colors) {
      if (command.includes(color)) {
        return color;
      }
    }
    return 'blue';
  }

  addChange(selector, property, oldValue, newValue) {
    this.changes.push({
      selector,
      property,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    });
  }

  saveDraft() {
    if (this.changes.length === 0) {
      speak('No changes to save');
      return { action: 'error', message: 'No changes to save' };
    }

    const summary = this.generateChangeSummary();
    speak('Draft saved. Summary emailed to you');

    return {
      action: 'draft_saved',
      message: 'Draft saved successfully',
      summary
    };
  }

  applyChanges() {
    if (this.changes.length === 0) {
      speak('No changes to apply');
      return { action: 'error', message: 'No changes to apply' };
    }

    const summary = this.generateChangeSummary();
    speak('Changes applied successfully');

    const result = {
      action: 'applied',
      message: 'Changes applied and saved',
      summary
    };

    this.changes = [];
    return result;
  }

  generateChangeSummary() {
    return this.changes.map((change, index) => ({
      number: index + 1,
      element: change.selector,
      property: change.property,
      before: change.oldValue,
      after: change.newValue,
      time: new Date(change.timestamp).toLocaleString()
    }));
  }

  clearChanges() {
    this.changes = [];
  }
}
