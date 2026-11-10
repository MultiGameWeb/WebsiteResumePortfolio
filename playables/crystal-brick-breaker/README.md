# Crystal Brick Breaker — YouTube Playables build

This folder is the YouTube Playables version of `games/crystal-brick-breaker.html`.
The portfolio version in `games/` is left unchanged.

## What the Playables build adds

| SDK feature | Where it runs |
|---|---|
| `<script src="https://www.youtube.com/game_api/v1">` | First tag in `<head>` |
| `ytgame.game.firstFrameReady()` | After the first canvas frame is drawn |
| `ytgame.game.gameReady()` | After saved data is loaded and the intro is playable |
| `ytgame.system.onPause` / `onResume` | Pauses the game; resumes only if the SDK paused it |
| `ytgame.system.isAudioEnabled` / `onAudioEnabledChange` | Sound effects go silent while YouTube is muted |
| `ytgame.game.loadData` / `saveData` | Best score + paddle theme (replaces `localStorage`) |
| `ytgame.engagement.sendScore` | On game over and stage clear, when the best score goes up |

## Sound effects

Sounds are synthesized with the Web Audio API, so there are no audio files to load. They cover paddle,
wall, brick, armor, TNT, laser, boss hit, boss defeat, power-up, life lost, stage clear, game start and
game over. Audio starts on the first tap or key press (browser rule), stays silent while YouTube is muted,
and is suspended while the game is paused by the SDK.

Every SDK call is guarded, so the file still plays normally when opened outside YouTube.

## Submitting

1. Zip the **contents** of this folder so that `index.html` is at the root of the zip.
2. Upload the zip in the Playables **Test Suite** and fix anything it flags.
3. Submit through the **Playables Portal** once the tests pass.
