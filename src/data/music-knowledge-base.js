export const musicKnowledgeBase = {
  musicTheory: {
    scale: {
      definition: 'A scale is a series of notes ordered by pitch.',
      details: 'Scales form the foundation of melody and harmony. The most common scales are major (happy sound) and minor (sad sound). A major scale follows the pattern: whole-whole-half-whole-whole-whole-half steps. For example, C major: C-D-E-F-G-A-B-C.',
      examples: ['C major: C D E F G A B C', 'A minor: A B C D E F G A', 'G major: G A B C D E F# G']
    },
    chord: {
      definition: 'A chord is three or more notes played together.',
      details: 'The most basic chord is a triad with three notes. Major chords sound happy (root + major 3rd + perfect 5th), minor chords sound sad (root + minor 3rd + perfect 5th). Example: C major chord = C + E + G.',
      examples: ['C major: C E G', 'A minor: A C E', 'G7: G B D F']
    },
    note: {
      definition: 'A note is a symbol representing a specific pitch and duration.',
      details: 'Notes have two main properties: pitch (how high or low) and duration (how long to hold). Note names repeat every octave: C, D, E, F, G, A, B. Duration is shown by the note shape: whole note (4 beats), half note (2 beats), quarter note (1 beat), eighth note (0.5 beats).',
      examples: ['Quarter note = 1 beat', 'Half note = 2 beats', 'Whole note = 4 beats']
    },
    sharp: {
      definition: 'A sharp (♯) raises a note by one half-step or semitone.',
      details: 'Sharps are placed before notes to raise their pitch. On piano, this is usually the black key to the right. C# is between C and D. Sharps in key signatures affect every occurrence of that note unless cancelled by a natural sign.',
      examples: ['C♯ is between C and D', 'F♯ is the black key after F', 'Key of G major has one sharp: F♯']
    },
    flat: {
      definition: 'A flat (♭) lowers a note by one half-step or semitone.',
      details: 'Flats are the opposite of sharps. On piano, this is usually the black key to the left. B♭ is between A and B. Some notes like E♭ and D♯ sound the same (enharmonic equivalents) but are written differently.',
      examples: ['B♭ is between A and B', 'E♭ is the black key before E', 'Key of F major has one flat: B♭']
    },
    natural: {
      definition: 'A natural (♮) cancels a previous sharp or flat.',
      details: 'The natural sign returns a note to its original pitch, removing any sharps or flats. It only lasts for that measure unless repeated. If a key signature has F♯, writing F♮ means play F natural for that measure.',
      examples: ['F♮ cancels F♯', 'B♮ cancels B♭', 'Natural signs last one measure']
    },
    treble: {
      definition: 'The treble clef (𝄞) indicates higher-pitched notes.',
      details: 'Also called G clef because it curls around the G line. Used for right-hand piano, violin, flute, trumpet, and most high voices. The lines spell EGBDF (Every Good Boy Does Fine), spaces spell FACE.',
      examples: ['Lines: E G B D F', 'Spaces: F A C E', 'Used for higher instruments']
    },
    bass: {
      definition: 'The bass clef (𝄢) indicates lower-pitched notes.',
      details: 'Also called F clef because the two dots surround the F line. Used for left-hand piano, bass guitar, cello, trombone, and low voices. The lines spell GBDFA (Good Boys Do Fine Always), spaces spell ACEG (All Cows Eat Grass).',
      examples: ['Lines: G B D F A', 'Spaces: A C E G', 'Used for lower instruments']
    },
    time: {
      definition: 'Time signature indicates how many beats are in each measure.',
      details: 'Written as two numbers: top = beats per measure, bottom = note value that gets one beat. 4/4 (common time) = 4 quarter notes per measure. 3/4 (waltz time) = 3 quarter notes per measure. 6/8 = 6 eighth notes per measure (feels like 2 groups of 3).',
      examples: ['4/4: 4 beats per measure', '3/4: Waltz time', '6/8: Two groups of three']
    },
    rest: {
      definition: 'A rest is a symbol indicating silence for a specific duration.',
      details: 'Rests have the same durations as notes: whole rest (4 beats of silence), half rest (2 beats), quarter rest (1 beat), eighth rest (0.5 beats). Rests are as important as notes - music needs silence to breathe.',
      examples: ['Whole rest = 4 beats silence', 'Quarter rest = 1 beat silence', 'Eighth rest = 0.5 beats silence']
    },
    interval: {
      definition: 'An interval is the distance between two pitches.',
      details: 'Intervals are named by counting letter names inclusive. C to E = 3rd (C-D-E = 3 letters). Perfect intervals (unison, 4th, 5th, octave) sound stable. Major/minor intervals (2nd, 3rd, 6th, 7th) vary in quality.',
      examples: ['Perfect 5th: C to G', 'Major 3rd: C to E', 'Octave: C to C']
    },
    tempo: {
      definition: 'Tempo is the speed of music, measured in beats per minute (BPM).',
      details: 'Common tempo markings: Largo (40-60 BPM, very slow), Adagio (66-76, slow), Andante (76-108, walking pace), Moderato (108-120, moderate), Allegro (120-168, fast), Presto (168-200, very fast).',
      examples: ['Largo = 40-60 BPM (very slow)', 'Allegro = 120-168 BPM (fast)', 'Presto = 168-200 BPM (very fast)']
    },
    dynamics: {
      definition: 'Dynamics indicate the volume of music.',
      details: 'From softest to loudest: ppp (pianississimo), pp (pianissimo), p (piano = soft), mp (mezzo-piano = medium soft), mf (mezzo-forte = medium loud), f (forte = loud), ff (fortissimo), fff (fortississimo). Crescendo (cresc. or <) means gradually get louder, diminuendo (dim. or >) means gradually get softer.',
      examples: ['p = soft', 'f = loud', 'ff = very loud', 'crescendo = get louder']
    },
    key: {
      definition: 'A key signature shows which notes are sharp or flat throughout a piece.',
      details: 'Key signatures appear after the clef at the beginning. They tell you the key (tonal center) of the piece. Order of sharps: F# C# G# D# A# E# B#. Order of flats: B♭ E♭ A♭ D♭ G♭ C♭ F♭. No sharps/flats = C major or A minor.',
      examples: ['1 sharp = G major', '2 flats = B♭ major', 'No sharps/flats = C major']
    },
    measure: {
      definition: 'A measure (or bar) is a segment of time containing a specific number of beats.',
      details: 'Measures are separated by vertical bar lines. Each measure must contain the exact number of beats specified by the time signature. In 4/4 time, each measure has 4 beats. Double bar lines indicate the end of a section or piece.',
      examples: ['In 4/4: each measure has 4 beats', 'Bar lines separate measures', 'Double bar = end of section']
    },
    octave: {
      definition: 'An octave is the interval between one pitch and another with double its frequency.',
      details: 'Octaves sound like the same note, just higher or lower. If middle C = 261.63 Hz, the C one octave higher = 523.25 Hz (double). Piano has about 7 octaves. Octaves are perfect intervals.',
      examples: ['C4 to C5 = one octave', 'Frequency doubles each octave', 'Sounds like same note']
    },
    rhythm: {
      definition: 'Rhythm is the pattern of sounds and silences in time.',
      details: 'Rhythm is created by combining different note durations. Syncopation is when emphasis is on unexpected beats. Dotted notes last 1.5x their value (dotted quarter = 1.5 beats). Ties connect notes to add their durations.',
      examples: ['Quarter note pattern: 1-2-3-4', 'Syncopation: emphasis on off-beats', 'Dotted quarter = 1.5 beats']
    },
    melody: {
      definition: 'Melody is a sequence of notes that form a recognizable tune.',
      details: 'A good melody has shape (contour), memorable phrases, and a clear relationship to the harmony. Melodies often move by steps (neighboring notes) with occasional leaps. The highest note is often the climax.',
      examples: ['Happy Birthday is a melody', 'Melodies have contour and shape', 'Usually moves by steps']
    },
    harmony: {
      definition: 'Harmony is the combination of notes played simultaneously.',
      details: 'Harmony supports the melody with chords. Consonant harmonies sound pleasant and stable (major and minor chords). Dissonant harmonies sound tense and want to resolve. Chord progressions create movement and emotion.',
      examples: ['I-IV-V-I progression', 'Chords support melody', 'Creates emotion in music']
    },
    cadence: {
      definition: 'A cadence is a harmonic progression that creates a sense of resolution or pause.',
      details: 'Perfect cadence (V-I): strongest ending. Plagal cadence (IV-I): "Amen" ending. Half cadence (ends on V): feels incomplete. Deceptive cadence (V-vi): surprise ending.',
      examples: ['Perfect: V-I (strong ending)', 'Plagal: IV-I (Amen)', 'Half cadence: ends on V']
    },
    transposition: {
      definition: 'Transposition is moving music to a different key.',
      details: 'When you transpose, every note moves by the same interval. If you transpose C major up a whole step, it becomes D major. This is useful for different instruments or vocal ranges. The relationships between notes stay the same.',
      examples: ['C major to D major (up 1 whole step)', 'Useful for different voices', 'Relationships stay same']
    }
  },

  counting: {
    '4/4': 'In 4/4 time, count "1-2-3-4" steadily. Quarter notes get 1 beat each. Half notes get 2 beats (count "1-2"). Whole notes get 4 beats (hold through "1-2-3-4"). Eighth notes are counted "1-and-2-and-3-and-4-and".',
    '3/4': 'In 3/4 time, count "1-2-3". This is waltz time with 3 beats per measure. Quarter notes get 1 beat. Dotted half notes get all 3 beats.',
    '6/8': 'In 6/8 time, count "1-2-3-4-5-6" or better, "1-2-3, 2-2-3" (two groups of three). Feels like 2 main beats with triplet subdivision. Eighth notes get 1 count.',
    '2/4': 'In 2/4 time, count "1-2". March time with 2 beats per measure. Quarter notes get 1 beat each.',
    syncopation: 'Syncopation emphasizes off-beats or weak beats. In 4/4, accenting "1-and-2-and-3-and-4-and" on the "ands" creates syncopation. Makes rhythm feel more interesting and energetic.',
    triplets: 'Triplets divide a beat into three equal parts instead of two. Count "1-trip-let, 2-trip-let, 3-trip-let, 4-trip-let". Three notes in the space of two.'
  },

  instruments: {
    piano: 'Piano has 88 keys (52 white, 36 black) spanning 7+ octaves. Right hand usually plays treble clef (melody), left hand plays bass clef (harmony/bass). Can play 10 notes simultaneously.',
    guitar: 'Standard guitar has 6 strings tuned E-A-D-G-B-E (low to high). Uses tablature (TAB) showing which fret to press on which string. Can play chords or single notes.',
    voice: 'The human voice is the most natural instrument. Main types: Soprano (high female), Alto (low female), Tenor (high male), Bass (low male). Uses lyrics and vowel shapes to create sound.',
    violin: 'Violin has 4 strings tuned G-D-A-E. Uses a bow to create sound or can be plucked (pizzicato). Reads treble clef. Has a very wide range of expression.',
    drums: 'Drums are percussion instruments that keep rhythm. Basic kit: bass drum (foot), snare drum (center), hi-hat (foot cymbals), toms, crash/ride cymbals. Creates rhythmic foundation.',
    trumpet: 'Trumpet is a brass instrument with 3 valves. Plays in treble clef. Changes pitch by pressing valve combinations and changing lip tension. Bright, powerful sound.',
    saxophone: 'Saxophone is a woodwind instrument (uses a reed). Common types: soprano, alto, tenor, baritone. Jazz instrument with expressive, smooth sound. Uses treble clef.',
    flute: 'Flute is a woodwind instrument. You blow across a hole (not into it). Light, airy sound. Reads treble clef. Very agile for fast passages.',
    cello: 'Cello is a string instrument held between the knees. Reads bass clef and tenor clef. Rich, warm sound. Range between viola and bass.',
    clarinet: 'Clarinet is a woodwind with a single reed. Smooth, warm tone. Wide range. Commonly used in orchestras and jazz. Reads treble clef.'
  },

  readingMusic: {
    staffLines: 'The staff has 5 lines and 4 spaces. In treble clef: lines are E-G-B-D-F (Every Good Boy Does Fine), spaces are F-A-C-E. In bass clef: lines are G-B-D-F-A (Good Boys Do Fine Always), spaces are A-C-E-G (All Cows Eat Grass).',
    ledgerLines: 'Ledger lines extend the staff for very high or low notes. Each ledger line/space represents the next note in the alphabet. Middle C sits on a ledger line between treble and bass staves.',
    accidentals: 'Accidentals are sharps (♯), flats (♭), or naturals (♮) written before individual notes. They last for the entire measure unless cancelled. They override the key signature for that note in that measure.',
    articulation: 'Articulation marks tell you HOW to play: staccato (dot above note) = short and detached, legato (curved line) = smooth and connected, accent (>) = emphasized, tenuto (—) = held for full value.',
    repeatSigns: 'Repeat signs ( 𝄆 and 𝄇 ) tell you to play a section again. 1st and 2nd endings: play 1st ending first time through, skip to 2nd ending on repeat. D.C. al Fine = return to beginning, play until "Fine".',
    expressionMarks: 'Expression marks guide performance: rit. (slow down), accel. (speed up), fermata (𝄐, hold note longer), sforzando (sfz, sudden accent), rubato (freely with tempo).'
  },

  practiceHelp: {
    tuning: 'Standard tuning: Guitar E-A-D-G-B-E, Piano A=440Hz, Violin G-D-A-E. Use a tuner or tuning fork. Tune from lowest to highest string. Check tuning regularly as temperature affects pitch.',
    sightReading: 'To improve sight-reading: 1) Look ahead while playing, 2) Keep steady tempo, 3) Don\'t stop for mistakes, 4) Practice daily with new music, 5) Start with easy pieces.',
    technique: 'Good technique: 1) Relax shoulders and hands, 2) Maintain good posture, 3) Practice slowly first, 4) Use a metronome, 5) Take breaks to avoid injury.',
    memorization: 'To memorize music: 1) Understand the structure, 2) Learn in small sections, 3) Practice away from instrument, 4) Sing/hum the melody, 5) Analyze harmonies and patterns.',
    rhythm: 'To improve rhythm: 1) Use a metronome daily, 2) Count out loud, 3) Tap foot or clap, 4) Record yourself, 5) Start slow and gradually increase tempo.'
  },

  appHelp: {
    songs: 'Browse all songs in the library from the Songs page. Search by title, composer, or key. Click any song to view full details, sheet music, and recordings. Editors and admins can add or edit songs.',
    practice: 'The Practice page has a chromatic tuner to help tune instruments. Upload and view sheet music files including PDFs, MusicXML, and Sibelius files. Set practice goals and track time.',
    addSong: 'To add a song (admins/editors only): Click "Add New Song", fill in title, composer, key, and tempo. Upload sheet music files, audio recordings, or add YouTube links. Save when done.',
    editSong: 'To edit a song: Go to Songs page, click the song, then click Edit button. Change any details, upload new files, or delete existing files. Save changes when finished.',
    tuner: 'The chromatic tuner shows the note you\'re playing and whether it\'s sharp or flat. Play your instrument near your device\'s microphone. The meter shows if you\'re in tune (green) or need adjustment.',
    vickie: 'That\'s me! I\'m Vickie, your music assistant. Ask me anything about music theory, how to read sheet music, how to count rhythms, or how to use this app. I\'m here to help!',
    tanya: 'Tanya is the design tool for admins. Use Tanya to customize the app\'s appearance, change colors, layouts, and add new features. Drag and drop components to redesign pages.',
    jp: 'JP is the task management assistant for admins. Activate JP by saying "JP, my guy". Ask JP to assign tasks, check task status, or manage team workflows.'
  }
};

export function findAnswer(question) {
  const q = question.toLowerCase().trim();

  for (const [category, items] of Object.entries(musicKnowledgeBase)) {
    for (const [key, value] of Object.entries(items)) {
      if (q.includes(key.toLowerCase())) {
        if (typeof value === 'object' && value.definition) {
          return `${value.definition}\n\n${value.details}\n\nExamples:\n${value.examples.join('\n')}`;
        }
        return value;
      }
    }
  }

  return null;
}
