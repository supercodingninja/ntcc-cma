# AI Systems Documentation for The NTCC Music App

## Overview
This document provides complete technical details for all AI systems in The NTCC Music App. Each AI has specific responsibilities and code locations.

---

## AI System #1: JP (Task Management AI)

### Purpose
JP is the admin task management AI that handles assigning and tracking tasks between admins, editors, and viewers.

### Activation Method
- Voice command: "JP, my guy" (initial activation)
- Subsequent commands: "JP" (after initial activation)
- Interface: Prompt window appears when activated

### Responsibilities
1. Listen to admin voice commands for task assignments
2. Parse natural language task descriptions
3. Assign tasks to editors or other admins
4. Track task completion status
5. Send notifications when tasks are completed or overdue

### Code Location & Technology Stack

**Primary Files:**
- `/src/contexts/AIContext.jsx` - JP AI state management (React Context API)
- `/src/services/jp-ai-service.js` - JP AI logic and voice recognition (JavaScript + Web Speech API)
- `/src/components/AI/JPPromptWindow.jsx` - JP UI interface (React + Tailwind CSS)
- `/src/hooks/useVoiceRecognition.js` - Voice command processing (Web Speech API)

**Database Tables Used:**
- `admin_tasks` - Stores all task information
- `users_profiles` - User data for task assignment

**Pseudo Code:**

```
FUNCTION activateJP():
  /*
   * This function activates the JP AI system when admin says "JP, my guy"
   * PROCESS:
   * 1. Listen for wake phrase using Web Speech API
   * 2. When detected, show prompt window
   * 3. Start continuous listening mode
   * 4. Parse commands and execute actions
   */

  START voice_recognition_service
  LISTEN FOR wake_phrase = "JP, my guy" OR "JP"

  IF wake_phrase DETECTED:
    DISPLAY jp_prompt_window
    SET listening_mode = TRUE
    PLAY confirmation_sound

    WHILE listening_mode IS TRUE:
      CAPTURE voice_input
      PARSE voice_input TO extract:
        - action_type (assign, check, update, cancel)
        - target_user (admin/editor name or email)
        - task_description
        - estimated_time

      IF action_type = "assign":
        CALL assignTask(target_user, task_description, estimated_time)
      ELSE IF action_type = "check":
        CALL checkTaskStatus(target_user OR task_id)
      ELSE IF action_type = "update":
        CALL updateTask(task_id, new_status)
      ELSE IF action_type = "cancel":
        SET listening_mode = FALSE
        CLOSE jp_prompt_window
    END WHILE
  END IF
END FUNCTION

FUNCTION assignTask(target_user, description, estimated_time):
  /*
   * Assigns a new task to specified user
   * STORES: Task in admin_tasks table
   * NOTIFIES: Target user via email/text
   */

  FIND user IN users_profiles WHERE name OR email MATCHES target_user
  IF user NOT FOUND:
    SPEAK "Cannot find user: {target_user}"
    RETURN
  END IF

  CREATE new_task IN admin_tasks:
    created_by = current_admin_id
    assigned_to = user.id
    task_type = "manual"
    description = description
    estimated_completion = NOW() + estimated_time
    status = "pending"

  SEND notification TO user.email AND user.phone
  SPEAK "Task assigned to {user.full_name}"
  LOG task_creation IN edit_history
END FUNCTION
```

**Dependencies:**
- npm: react@19.2.0
- npm: @supabase/supabase-js@2.81.1
- Browser API: Web Speech API (built-in)

---

## AI System #2: Tanya (Design & Styling AI)

### Purpose
Tanya is the design assistant AI that helps admins modify the app's visual appearance without writing code.

### Activation Method
- Click "Design" button (shows Tanya AI icon)
- Hover over button to see Tanya's description
- Drag, drop, point, and speak to make changes

### Responsibilities
1. Understand natural language design requests
2. Interpret visual gestures (drag, drop, resize)
3. Modify CSS and styling in real-time
4. Handle z-index layering
5. Save draft changes or apply immediately
6. Email change summaries to scn@scn.ninja

### Code Location & Technology Stack

**Primary Files:**
- `/src/components/AI/TanyaDesignTool.jsx` - Main Tanya interface (React + Tailwind CSS)
- `/src/services/tanya-ai-service.js` - Tanya AI logic (JavaScript)
- `/src/contexts/DesignContext.jsx` - Design state management (React Context API)
- `/src/utils/css-manipulator.js` - CSS modification utilities (JavaScript)
- `/src/hooks/useDragDrop.js` - Drag and drop functionality (React DnD)

**Database Tables Used:**
- `style_changes` - Stores draft and applied style changes
- `edit_history` - Logs all changes made

**Pseudo Code:**

```
FUNCTION activateTanya():
  /*
   * Activates Tanya design tool interface
   * SHOWS: Visual design editor with drag-drop capabilities
   * LISTENS: For voice commands and mouse/touch gestures
   */

  DISPLAY tanya_design_interface WITH:
    - Element selector mode
    - Style property editor
    - Color picker
    - Z-index controller
    - Draft/Apply buttons

  INITIALIZE voice_recognition FOR design_commands
  INITIALIZE gesture_tracking FOR mouse_and_touch

  SET edit_mode = TRUE
  CREATE empty change_log = []

  WHILE edit_mode IS TRUE:
    LISTEN FOR:
      - voice_command (e.g., "make this bigger", "change color to blue")
      - mouse_drag (element repositioning)
      - mouse_click (element selection)
      - resize_handle (element resizing)

    IF voice_command DETECTED:
      PARSE command TO extract:
        - target_element (what to modify)
        - property (color, size, position, etc.)
        - value (new value for property)

      APPLY_STYLE_CHANGE(target_element, property, value)
      ADD change TO change_log

    ELSE IF mouse_drag DETECTED:
      UPDATE element.position TO mouse_coordinates
      ADD position_change TO change_log

    ELSE IF resize_handle DETECTED:
      UPDATE element.dimensions TO new_size
      ADD size_change TO change_log

    DISPLAY preview OF changes IN real_time
  END WHILE
END FUNCTION

FUNCTION APPLY_STYLE_CHANGE(element, property, value):
  /*
   * Applies a style change to specified element
   * UPDATES: CSS in memory (preview mode)
   * LOGS: Change for later application or draft save
   */

  FIND target_element IN DOM by selector
  IF target_element NOT FOUND:
    SPEAK "Cannot find element: {element}"
    RETURN
  END IF

  CREATE style_change = {
    element_selector: get_css_selector(target_element),
    property: property,
    old_value: target_element.style[property],
    new_value: value,
    timestamp: NOW(),
    changed_by: current_admin_id
  }

  APPLY style TO target_element:
    target_element.style[property] = value

  RETURN style_change
END FUNCTION

FUNCTION saveDraft():
  /*
   * Saves all pending changes as draft
   * EMAILS: Change summary to current admin user
   * STORES: In style_changes table with status='draft'
   */

  CREATE draft_record IN style_changes:
    created_by = current_admin_id
    changes = JSON.stringify(change_log)
    status = "draft"
    created_at = NOW()

  GENERATE email_body WITH:
    - All changes made (before/after)
    - File paths affected
    - CSS selectors modified

  SET email_subject = "Changes To Make"
  SEND email TO current_admin.email WITH:
    subject = email_subject
    body = email_body

  SPEAK "Draft saved and emailed to you"
  CLEAR change_log
END FUNCTION

FUNCTION applyAllChanges():
  /*
   * Applies all pending changes permanently
   * WRITES: CSS changes to actual files
   * EMAILS: Change summary to scn@scn.ninja
   * LOGS: All changes in edit_history
   */

  FOR EACH change IN change_log:
    WRITE change TO actual_css_file
    LOG change IN edit_history TABLE
  END FOR

  CREATE change_summary INCLUDING:
    - Original CSS code with line numbers
    - Modified CSS code with line numbers
    - File paths
    - Admin who made changes
    - Timestamp

  SEND email TO "scn@scn.ninja" WITH:
    subject = "App Style Changes Applied"
    body = change_summary

  UPDATE style_changes SET status = "applied", applied_at = NOW()
  SPEAK "All changes applied successfully"
  CLEAR change_log
END FUNCTION
```

**Dependencies:**
- npm: react@19.2.0
- npm: react-dnd@16.0.1 (drag and drop)
- npm: @supabase/supabase-js@2.81.1
- Browser API: Web Speech API (built-in)
- CSS: Tailwind CSS v3.4.1

---

## AI System #3: Vickie (Music Knowledge AI)

### Purpose
Vickie is the comprehensive music knowledge AI that helps all users understand music theory, read sheet music, and learn about artists and songs.

### Activation Method
- Available to ALL user roles
- Click "Ask Vickie" button
- Voice-activated: "Hey Vickie" or "Vickie, help"

### Responsibilities
1. Explain music theory concepts
2. Help read sheet music (note by note)
3. Provide music definitions
4. Share artist and song history
5. Guide users on which features to use
6. Answer questions about the app itself

### Code Location & Technology Stack

**Primary Files:**
- `/src/components/AI/VickieMusicAssistant.jsx` - Vickie UI interface (React + Tailwind CSS)
- `/src/services/vickie-ai-service.js` - Vickie AI knowledge base (JavaScript)
- `/src/data/music-theory-database.json` - Music theory definitions (JSON)
- `/src/utils/sheet-music-reader.js` - Sheet music parsing utilities (JavaScript)
- `/src/hooks/useVickieChat.js` - Chat interface hook (React)

**Database Tables Used:**
- `songs` - Access to song data for information
- `users_profiles` - User role for contextual help

**Pseudo Code:**

```
FUNCTION activateVickie(user_role):
  /*
   * Activates Vickie music assistant interface
   * SHOWS: Chat-style interface with voice and text input
   * PROVIDES: Role-appropriate help and music knowledge
   */

  DISPLAY vickie_chat_interface WITH:
    - Chat history window
    - Text input field
    - Voice input button
    - Music notation display area

  LOAD music_theory_database FROM JSON
  INITIALIZE voice_recognition FOR questions

  GREET user WITH: "Hi! I'm Vickie, your music assistant. How can I help you today?"

  SET listening_mode = TRUE

  WHILE listening_mode IS TRUE:
    LISTEN FOR:
      - text_input (typed question)
      - voice_input (spoken question)

    GET user_question FROM input
    ANALYZE question_type:
      - music_theory (chords, scales, intervals, etc.)
      - sheet_music_reading (help reading specific notation)
      - artist_information (artist history, song details)
      - app_navigation (how to use features)
      - note_counting (count notes in a stanza)

    GENERATE response BASED ON question_type
    DISPLAY response IN chat_window
    SPEAK response IF voice_mode_enabled
  END WHILE
END FUNCTION

FUNCTION answerMusicTheory(question):
  /*
   * Answers music theory questions
   * SEARCHES: Music theory database for relevant concepts
   * PROVIDES: Clear explanations with examples
   */

  EXTRACT key_terms FROM question
  SEARCH music_theory_database FOR key_terms

  IF matches FOUND:
    CREATE response INCLUDING:
      - Definition of concept
      - Musical examples
      - Visual diagram (if applicable)
      - Related concepts
    RETURN response
  ELSE:
    RETURN "I don't have information on that yet. Could you rephrase or ask about something else?"
  END IF
END FUNCTION

FUNCTION readSheetMusic(song_id, stanza_number):
  /*
   * Reads sheet music notation for specified stanza
   * PARSES: Sheet music file (.sib or .pdf)
   * DESCRIBES: Each note, rest, and symbol
   */

  LOAD song FROM songs TABLE WHERE id = song_id
  LOAD sheet_music_file FROM song.sheet_music_file

  IF song.sheet_music_type = "sib":
    PARSE_SIB_FILE(sheet_music_file)
  ELSE IF song.sheet_music_type = "pdf":
    PARSE_PDF_FILE(sheet_music_file)
  END IF

  EXTRACT stanza_data FOR stanza_number

  FOR EACH note IN stanza_data:
    DESCRIBE note WITH:
      - Note name (C, D, E, etc.)
      - Octave (C4, C5, etc.)
      - Duration (whole, half, quarter, eighth, etc.)
      - Any accidentals (sharp, flat, natural)
      - Dynamic markings
  END FOR

  CREATE readable_description OF stanza
  SPEAK description note_by_note IF requested
  RETURN readable_description
END FUNCTION

FUNCTION explainArtist(artist_name):
  /*
   * Provides information about musical artists
   * NOTE: Uses built-in knowledge (free, no external APIs)
   * SEARCHES: Local database of artist information
   */

  SEARCH local_artist_database FOR artist_name

  IF artist FOUND:
    CREATE response INCLUDING:
      - Artist biography
      - Musical style
      - Notable works
      - Awards and recognition
      - Songs in our database by this artist

    QUERY songs TABLE WHERE artist = artist_name
    ADD song_list TO response

    RETURN response
  ELSE:
    RETURN "I don't have detailed information on {artist_name}. Would you like to know about songs by this artist in our database?"
  END IF
END FUNCTION

FUNCTION guideAppUsage(user_role, question):
  /*
   * Helps users understand which app features to use
   * PROVIDES: Role-specific guidance
   * SUGGESTS: Best AI tool for their needs
   */

  IF question CONTAINS "task" OR "assign":
    IF user_role = "admin":
      RETURN "For task management, you should use JP. Say 'JP, my guy' to activate him."
    ELSE:
      RETURN "Only admins can assign tasks using JP. You can view your assigned tasks in the Tasks section."
    END IF

  ELSE IF question CONTAINS "design" OR "style" OR "change look":
    IF user_role = "admin":
      RETURN "For design changes, use Tanya! Click the 'Design' button to activate her."
    ELSE IF user_role = "editor":
      RETURN "Editors can make design changes when tasked by an admin. Check your Tasks section."
    ELSE:
      RETURN "Only admins and editors can modify the app design."
    END IF

  ELSE IF question CONTAINS "music" OR "theory" OR "read" OR "note":
    RETURN "That's my specialty! Ask me anything about music theory, reading notation, or song information."

  ELSE:
    PROVIDE general_navigation_help BASED ON user_role
  END IF
END FUNCTION
```

**Dependencies:**
- npm: react@19.2.0
- npm: @supabase/supabase-js@2.81.1
- Browser API: Web Speech API (built-in)
- Local Data: music-theory-database.json

---

## Implementation Notes

### Voice Recognition Setup (All AIs)
```javascript
// File: /src/hooks/useVoiceRecognition.js
// Technology: Web Speech API (built-in browser feature)
// No external services required (FREE)

const SpeechRecognition = window.SpeechRecognition || window.webKitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  processVoiceCommand(transcript);
};
```

### Text-to-Speech Setup (All AIs)
```javascript
// File: /src/utils/text-to-speech.js
// Technology: Web Speech Synthesis API (built-in browser feature)
// No external services required (FREE)

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}
```

### Email Notifications
```javascript
// File: /src/services/email-service.js
// Technology: User's email client (mailto links)
// No external services required (FREE)

function sendEmail(to, subject, body) {
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}
```

---

## File Structure Summary

```
/src
├── components/
│   └── AI/
│       ├── JPPromptWindow.jsx        [JP UI - React + Tailwind]
│       ├── TanyaDesignTool.jsx       [Tanya UI - React + Tailwind]
│       └── VickieMusicAssistant.jsx  [Vickie UI - React + Tailwind]
├── services/
│   ├── jp-ai-service.js              [JP Logic - JavaScript]
│   ├── tanya-ai-service.js           [Tanya Logic - JavaScript]
│   └── vickie-ai-service.js          [Vickie Logic - JavaScript]
│   └── email-service.js              [Email - JavaScript]
├── contexts/
│   ├── AIContext.jsx                 [AI State - React Context]
│   └── DesignContext.jsx             [Design State - React Context]
├── hooks/
│   ├── useVoiceRecognition.js        [Voice Input - Web Speech API]
│   ├── useDragDrop.js                [Drag/Drop - React DnD]
│   └── useVickieChat.js              [Chat UI - React]
├── utils/
│   ├── css-manipulator.js            [CSS Editing - JavaScript]
│   ├── sheet-music-reader.js         [Sheet Music Parser - JavaScript]
│   └── text-to-speech.js             [Voice Output - Web Speech Synthesis]
└── data/
    └── music-theory-database.json    [Music Knowledge - JSON]
```

---

## Default User Credentials

### Super Admin (App Creator)
- **Username:** SCN
- **Email:** scn@scn.ninja
- **Password:** ShowBiz-Pizza82
- **Role:** admin
- **Permissions:** Full control, can delete any admin, no approval required

### Admin Users
- **Initial Signup Password:** !r0N M1k3
- **After Signup:** Prompted to create individual password
- **Permissions:** Full control except cannot delete admins alone (requires 2 admins)

### Editor Users
- **Initial Signup Password:** 3d1t
- **After Signup:** Prompted to create individual password
- **Permissions:** Can edit songs, complete tasks, request style changes

### Viewer Users
- **Initial Signup Password:** v13w
- **After Signup:** Prompted to create individual password
- **Permissions:** View-only access, starts with John Smith memorial page

---

## Technology Stack Summary

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend Framework | React 19.2.0 | FREE |
| Styling | Tailwind CSS 3.4.1 | FREE |
| Database | Supabase (PostgreSQL) | FREE |
| Voice Recognition | Web Speech API | FREE |
| Text-to-Speech | Web Speech Synthesis API | FREE |
| Drag & Drop | React DnD 16.0.1 | FREE |
| PWA Support | Vite PWA Plugin | FREE |
| State Management | React Context API | FREE |
| Email | User's Email Client (mailto) | FREE |

**Total External Services Required:** ZERO
**Total Monthly Cost:** $0.00 (Completely Free)

---

## Notes for Future Modification

All AI code is heavily pseudo-coded and commented. To modify any AI:

1. Locate the AI's service file in `/src/services/`
2. Read the pseudo code comments explaining each function
3. Modify the logic as needed
4. Test with voice commands or UI interactions
5. Update this documentation if behavior changes

All AI systems are designed to work offline and require no external API keys or paid services.
