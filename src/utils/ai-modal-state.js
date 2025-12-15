export const AI_MODAL_STORAGE_KEYS = {
  VICKIE: 'vickie_conversation',
  TANYA: 'tanya_conversation',
  JP: 'jp_conversation',
  VICKIE_STATE: 'vickie_modal_state',
  TANYA_STATE: 'tanya_modal_state',
  JP_STATE: 'jp_modal_state'
};

export function saveConversation(key, messages) {
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

export function loadConversation(key, defaultMessages = []) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultMessages;
  } catch (error) {
    console.error('Failed to load conversation:', error);
    return defaultMessages;
  }
}

export function clearConversation(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear conversation:', error);
  }
}

export function saveModalState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save modal state:', error);
  }
}

export function loadModalState(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : { isMinimized: false };
  } catch (error) {
    console.error('Failed to load modal state:', error);
    return { isMinimized: false };
  }
}
