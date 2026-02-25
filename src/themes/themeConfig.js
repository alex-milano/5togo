// ─── Theme definitions ────────────────────────────────────────────────────────
// Each theme defines:
//   - Column names/icons for Worker side and Life side
//   - CSS class applied to <html data-theme="...">

const col = (name, sub, icon) => ({ name, sub, icon })

export const THEMES = {

  normal: {
    name: 'Default', icon: '🏆',
    worker: {
      headerLabel: '⚡ WORKER MODE',
      locked:    col('Locked In',    'To Do',        '🎯'),
      progress:  col('In The Zone',  'In Progress',  '⚡'),
      touchdown: col('Touchdown',    'Done',         '🏆'),
    },
    life: {
      headerLabel: '🏠 LIFE MODE',
      locked:    col('To Do',        'Planned',      '📝'),
      progress:  col('Doing',        'In Progress',  '🔄'),
      touchdown: col('Done',         'Completed',    '✅'),
    },
    ice: col('Ice Bucket', 'Frozen / Paused', '🧊'),
  },

  aesthetic: {
    name: 'Aesthetic', icon: '✨',
    worker: {
      headerLabel: '✨ WORKER MODE',
      locked:    col('Dreaming',    'Ideas',        '💭'),
      progress:  col('Flowing',     'In Progress',  '🌊'),
      touchdown: col('Glowing',     'Done',         '🌟'),
    },
    life: {
      headerLabel: '💖 LIFE MODE',
      locked:    col('Wishlist',    'Planned',      '💖'),
      progress:  col('Working On',  'Ongoing',      '✨'),
      touchdown: col('Achieved',    'Done',         '💫'),
    },
    ice: col('On Hold', 'Paused ✨', '🌙'),
  },

  football: {
    name: 'Football', icon: '🏈',
    worker: {
      headerLabel: '🏈 GAME TIME',
      locked:    col('Pre-Game',      'Ready',      '🏟️'),
      progress:  col('On The Field',  'In Play',    '🏃'),
      touchdown: col('Touchdown',     'Scored',     '🏈'),
    },
    life: {
      headerLabel: '🏠 OFF FIELD',
      locked:    col('Off-Season',  'Planned',      '📋'),
      progress:  col('Training',    'In Progress',  '💪'),
      touchdown: col('Victory',     'Done',         '🏆'),
    },
    ice: col('On Bench', 'Benched', '🪑'),
  },

  soccer: {
    name: 'Soccer', icon: '⚽',
    worker: {
      headerLabel: '⚽ MATCH DAY',
      locked:    col('Warm Up',       'Ready',    '⚽'),
      progress:  col('On The Pitch',  'In Play',  '🏃'),
      touchdown: col('GOAL!',         'Scored',   '🥅'),
    },
    life: {
      headerLabel: '🏠 LOCKER ROOM',
      locked:    col('Locker Room', 'Planned',      '🔑'),
      progress:  col('Practicing',  'In Progress',  '🎯'),
      touchdown: col('Win',         'Done',         '🏆'),
    },
    ice: col('Injured List', 'Paused', '🩹'),
  },

  basketball: {
    name: 'Basketball', icon: '🏀',
    worker: {
      headerLabel: '🏀 GAME ON',
      locked:    col('Bench',      'Ready',    '🪑'),
      progress:  col('On Court',   'In Play',  '🏀'),
      touchdown: col('Slam Dunk',  'Scored',   '🎯'),
    },
    life: {
      headerLabel: '🏠 OFF COURT',
      locked:    col('Practice', 'Planned',      '📋'),
      progress:  col('Playing',  'In Progress',  '⛹️'),
      touchdown: col('Swish',    'Done',         '🏆'),
    },
    ice: col('Timeout', 'Paused', '⏸️'),
  },

  baseball: {
    name: 'Baseball', icon: '⚾',
    worker: {
      headerLabel: '⚾ PLAY BALL',
      locked:    col('Dugout',    'Ready',    '⚾'),
      progress:  col('At Bat',    'In Play',  '🏏'),
      touchdown: col('Home Run',  'Scored',   '🏟️'),
    },
    life: {
      headerLabel: '🏠 BULLPEN',
      locked:    col('Bullpen',  'Planned',      '📋'),
      progress:  col('On Base',  'In Progress',  '🏃'),
      touchdown: col('Score',    'Done',         '🏆'),
    },
    ice: col('Disabled List', 'Paused', '🩹'),
  },
}

export function getTheme(id) {
  return THEMES[id] || THEMES.normal
}
