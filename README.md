# Words of Havoc

A word-matching game where players shoot words to match their synonyms across four increasingly difficult levels.

## Features

- **Four challenging levels** with increasing difficulty:
  - Level 1: Word Rookie - "Every siege starts with a simple word."
  - Level 2: Vocab Apprentice - "Learning the craft of word warfare."
  - Level 3: Thesaurus Warrior - "Meaning must fall."
  - Level 4: Semantic Reaper - "Aim where you smell dread. The right words fear you."
  
- **Gameplay mechanics:**
  - Click and hold words to aim
  - Drag to adjust power and direction
  - Release to shoot at matching synonyms
  - Score points for correct matches, lose points for incorrect ones
  - Must achieve a positive score to progress to the next level

- **Leaderboard system:**
  - Local storage for single-player use
  - Optional server-side leaderboard for multi-player deployments
  - Records player name, score, and date
  - View top 50 scores

- **User Interface:**
  - Level information with taglines
  - Current and overall score tracking
  - Visual feedback for correct/incorrect matches
  - Sound effects and particle animations
  - Responsive design for various screen sizes

## How to Play

1. Open `index.html` in your browser
2. Click "Start Level" to begin
3. Click and hold a word on the left
4. Drag to aim at the matching synonym on the right
5. Release to fire the word
6. Score +1 for correct matches, -1 for incorrect
7. Complete all levels with positive scores to win

## Deployment Options

### 1. Single-Player Mode (No Installation Required)

For single-player use or testing, simply open the `index.html` file in your browser. The leaderboard will use localStorage and will only be visible to the current user.

### 2. PHP Leaderboard (Shared Web Hosting)

For a shared leaderboard on standard web hosting:

1. Make sure your hosting supports PHP (most do)
2. Edit `game.js` and change:
   ```javascript
   const LEADERBOARD_SERVER_ENABLED = true;
   ```
3. Upload all files including `leaderboard.php` to your hosting
4. Make sure the server can write to the directory (for leaderboard-data.json)
5. Access your game via your hosting URL

See `php-deployment.html` for detailed instructions.

## Credits

- Vibe coded by Ahmed Kharrufa
- Sounds from Mixkit.co 