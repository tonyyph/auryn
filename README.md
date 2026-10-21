# Auryn — Aurora Numbers

*Merge into the light.* A 2048-style number puzzle for iOS and Android, built with Expo.

**Look: "Aurora Arcade".** The pre-blurred aurora is the backdrop. Everything on top of it is an
arcade object. Buttons are keycaps that press down into a solid slab, and tiles are small keycaps
too. The Home menu is laid out as a 2048 board: Play is a 3×2 gold tile, and Records, Settings,
Rules and New run are tiles of their own. The game HUD shows a large score, a tilted record plate
with a "NEW BEST!" sticker, a ladder of the next tiles to reach, corner brackets around the board,
a "COMBO ×N" or "512!" callout, and an Undo key whose pip shows its single charge. Copy is written
in a game voice in English and Vietnamese.

## Run it

```sh
pnpm install
pnpm start          # Metro; press i / a, or scan with Expo Go 58
pnpm ios            # build and run iOS locally; requires Xcode and CocoaPods
pnpm android        # expo start --android
pnpm web            # browser build (arrow keys work there)
```

The iOS command clears inherited `GEM_HOME` and `GEM_PATH` so CocoaPods uses the gems
for its own Ruby installation, avoiding conflicts between RVM and Homebrew Ruby.

Stack: Expo SDK 58, React Native 0.88, Expo Router 58, Reanimated 4.7 / Worklets 0.13,
Gesture Handler 3.3 (hook API), expo-audio, expo-haptics, AsyncStorage, Zustand. Versions
were resolved with `npx expo install`, and `npx expo-doctor` passes 20/20.

**Expo Go is enough.** Every native module used ships in Expo Go 58, so no development build
is needed. For a standalone build, use `npx expo run:ios|android` (local) or `eas build`
(the bundle id is `com.auryn.numbers`).

## TestFlight

EAS project: [cuongphan2/auryn](https://expo.dev/accounts/cuongphan2/projects/auryn).
The `production` profile in `eas.json` builds a signed App Store Release IPA.
EAS manages the build number remotely and increments it for each build.
The generated `ios/` and `android/` folders are ignored; EAS regenerates them from app config.

First-time setup (requires an active Apple Developer Program membership).
Use Apple ID `ynotechcially@gmail.com` and complete password/2FA prompts directly
in your terminal:

```sh
pnpm eas:whoami       # should show cuongphan2
pnpm build:ios        # sign in to Apple when prompted; configure distribution signing
pnpm submit:ios       # create/select the App Store Connect app and configure upload credentials
```

Alternatively, run `pnpm release:ios` for checks, signing, building, and upload in
one command, including the first-time interactive setup.

Use `com.auryn.numbers` for the App Store Connect bundle ID. After the first submission,
set `submit.production.ios.ascAppId` in `eas.json` to the numeric Apple ID from
App Store Connect → AURYN → App Information. This identifies the upload destination.
For automated uploads, use `pnpm eas:credentials` → production → App Store Connect
to configure an API key for EAS Submit. Keep private keys and passwords out of Git.

Subsequent releases:

```sh
pnpm release:ios      # checks, builds, and automatically uploads that same build
pnpm eas:builds       # view recent iOS builds
```

After Apple finishes processing the upload, add the build to a tester group in
App Store Connect → TestFlight. External testing requires Apple's beta review;
enable a public link on the external group if you want to share an install link.
Uploading to TestFlight does not release the app publicly on the App Store.

## Checks

```sh
pnpm verify         # tsc --noEmit + expo lint + jest (124 tests)
```

| Suite | Covers |
| --- | --- |
| `src/engine/__tests__` | the four required left-merge examples, all four directions, one merge per tile per move, score, invalid moves (no spawn / score / move / undo cost), spawn only into empty cells and ≈10% fours, full-but-mergeable ≠ game over, win once then keep going, undo restores exactly, deterministic seeded RNG, statistics never double count |
| `src/presentation/__tests__` | motion/resolved frames (no ghosts, survivors on top), input buffer policy (max one buffered swipe, interrupt drops it, stale completions ignored) |
| `src/persistence/__tests__` | latest-write-wins serialised writer, versioned envelope, corrupt/missing data fallbacks, restoring a won game |
| `src/state/__tests__` | store integration: game over → undo → game over counts once, restored celebrated game does not re-celebrate, settings persist |
| `src/theme/__tests__` | WCAG contrast for every tile, text colour and keycap tone, board fits SE → Pro Max → iPad without scrolling, Manrope and Unbounded cover Vietnamese and have `tnum` |
| `src/components/game/__tests__` | swipe threshold / dominant axis / flick, tile ladder steps |

## Architecture

```
src/engine/        Pure TypeScript rules: board.ts (slide/merge/spawn), session.ts (undo, stats, milestone flags). No React.
src/presentation/  frames.ts (what the board draws per phase), turnController.ts (input policy while animating)
src/persistence/   schema.ts (versioned, validated), writer.ts (serialised + debounced), storage.ts
src/state/         appStore.ts (Zustand: engine + persistence wiring), environment.ts (system Reduce Motion, app active), screenReader.ts
src/feedback/      sound + haptics (one cue per move, never per merge)
src/i18n/          en.ts (source + type), vi.ts
src/theme/         colors, tiles (material per value), typography, layout (spacing, radii, responsive board), motion tokens
src/components/    AuroraBackground, NumberTile, game/{GameBoard, AnimatedTile, ScoreHeader, Hud, GameControls}, Overlay, dialogs, primitives (Key, Sticker)
src/app/           Expo Router screens: index (Home), game, stats, settings, dev + preview (dev only)
tools/             generate-assets.mjs, generate-sounds.mjs
```

**A turn.** A swipe commits to the store immediately (rules state is never behind). The board
then shows a *motion frame*: every tile slides to its destination still showing its old value,
and consumed tiles slide underneath their survivors. When the 120 ms slide finishes (a Reanimated
completion callback, not a JS timer), the *resolved frame* swaps in. Consumed tiles disappear
under their survivor, the survivor shows its doubled value with a 1 → 1.06 → 1 pulse and a halo,
and the spawned tile fades and scales in from 0.88. Tiles are keyed by stable engine ids, so
nothing remounts between frames.

**Input while animating.** At most one direction is buffered, and a newer swipe replaces it. It
commits when the slide ends, against the latest state. Undo, restart, leaving the screen and
backgrounding the app all interrupt: the buffer is dropped and the board snaps to the committed
state.

**Statistics definitions.** These are in `src/engine/session.ts`:
- *Best score* is never lowered by undo.
- *Games completed* counts games that ended with no moves, or were replaced by a new game after
  at least one move. Each game counts once.
- *Games reaching 2048* counts each game once.
- *Highest tile* is never lowered by undo.
- *Valid moves*: an undo takes its move back off.

The flags that prevent double counting (`celebrated`, `winCounted`, `finishCounted`) live
outside the undo snapshot on purpose.

**Persistence.** The app autosaves after every committed change: the session (tile ids, score,
moves, undo snapshot, flags), stats, settings and onboarding. Each key has its own writer that
only ever writes the newest snapshot, with one write in flight. Saves don't depend on the
background event, which only flushes the queue early. Bad data falls back safely: a session is
all-or-nothing, and stats and settings recover field by field.

**Reduce Motion.** The app follows the OS setting, and the in-app toggle can only add to it: when
the system asks for reduced motion, the toggle shows on and is locked. With it on, the aurora and
the Home tiles are still, slides take 70 ms, merges use the halo only (no scale), and screens fade.

## Dev links (development builds only)

`src/app/dev.tsx` and `src/app/preview.tsx` redirect home when `__DEV__` is false.

```sh
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev?preset=nearWin&moves=left"   # 2048 → celebration
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev?preset=nearOver&moves=left&seed=1"  # game over
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev?preset=combo&moves=left"           # COMBO ×3 callout
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev?preset=late&lang=vi&pad=1"
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/dev?screen=preview"               # all tiles + button states
```

Params: `preset` (sparse, mid, late, combo, nearWin, nearOver, full, new), `screen`
(game, help, stats, settings, preview), `lang` (en, vi), `pad` and `rm` (0/1), `moves`
(comma list), `burst=1` (40 ms between moves), `undo=1` (undo mid-slide), `reset=stats`.

## Assets and licences

- **Fonts:** Unbounded (display) and Manrope (body, tile numerals), both SIL Open Font License 1.1,
  via `@expo-google-fonts/unbounded` and `@expo-google-fonts/manrope`.
- **Icon, splash, aurora layers, grain:** original geometry rendered by `tools/generate-assets.mjs`
  (`pnpm assets`), with the blur baked in so the app only animates transforms.
- **Sounds:** synthesised from sine partials by `tools/generate-sounds.mjs` (`pnpm sounds`).
  There are no samples and no third-party audio.
- **Icons:** hand-drawn line icons in `src/components/Icon.tsx`. No icon font, no emoji.

## Known limits

- Real touch swipes have not been tested on the simulator, because I didn't drive it with mouse
  input. Turns were driven through the same store and board code via dev links. The swipe maths
  is unit tested. Thresholds (24 pt drag, or a ≥ 450 pt/s flick of 10 pt) should be tuned on a
  real phone.
- 60 fps has not been measured. Tile motion runs on the UI thread, and the background is static
  images moved by transforms, but no profiling was done on a mid-range Android device.
- Android has not been run. All styles used (`boxShadow`, per-side border colours, gradients) are
  supported by RN 0.88 on Android, but nothing was checked visually there.
- VoiceOver flow (board description, the four custom move actions, announcements) is implemented
  but was not walked through with VoiceOver on.
