import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, GameOverModal, HowToPlaySheet, MilestoneModal } from '../components/dialogs';
import { GameBoard, type GameBoardHandle } from '../components/game/GameBoard';
import { DirectionPad, GameControls, PAD_HEIGHT } from '../components/game/GameControls';
import { ComboCallout, TileLadder } from '../components/game/Hud';
import { ScoreHeader } from '../components/game/ScoreHeader';
import { IconButton } from '../components/primitives';
import { hasProgress, isGameOver, isNewBest, maxTile, type Direction } from '../engine';
import { feedback } from '../feedback/feedback';
import { useStrings } from '../i18n';
import { HINT_MOVES, useAppStore } from '../state/appStore';
import { triggerFlare, useEnvironment } from '../state/environment';
import { colors, computeGameLayout, fonts, space, type } from '../theme';

type Dialog = 'restart' | 'help' | null;

export default function Game() {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const board = useAppStore((s) => s.session.board);
  const session = useAppStore((s) => s.session);
  const stats = useAppStore((s) => s.stats);
  const winPending = useAppStore((s) => s.winPending);
  const showPad = useAppStore((s) => s.settings.directionPad);
  const hintMoves = useAppStore((s) => s.onboarding.hintMoves);
  const active = useEnvironment((s) => s.active);
  const boardRef = useRef<GameBoardHandle>(null);
  const [idle, setIdle] = useState(true);
  const params = useLocalSearchParams<{ help?: string }>();
  const [dialog, setDialog] = useState<Dialog>(params.help === '1' ? 'help' : null);

  const layout = computeGameLayout({ width, height, insets, padHeight: showPad ? PAD_HEIGHT : 0, fontScale });
  const over = isGameOver(board);
  const showWin = winPending && idle;
  const showOver = over && idle && !winPending;
  const overlayOpen = dialog !== null || showWin || showOver;

  // Milestone and game-over cues fire once per occurrence, when the board has settled.
  const winCue = useRef(false);
  useEffect(() => {
    if (showWin && !winCue.current) {
      winCue.current = true;
      triggerFlare();
      feedback.milestone();
    }
    if (!winPending) winCue.current = false;
  }, [showWin, winPending]);
  const overCue = useRef<string | null>(null);
  useEffect(() => {
    const key = `${session.gameId}:${board.moves}`;
    if (showOver && overCue.current !== key) {
      overCue.current = key;
      feedback.gameOver();
    }
  }, [showOver, session.gameId, board.moves]);

  // Leaving the screen or the app mid-turn snaps the board to committed state.
  useFocusEffect(
    useCallback(() => {
      const ref = boardRef.current;
      return () => ref?.settle();
    }, []),
  );
  useEffect(() => {
    if (!active) boardRef.current?.settle();
  }, [active]);

  const move = useCallback((d: Direction) => boardRef.current?.input(d), []);

  // Arrow keys on web / hardware keyboards that reach the web build.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const map: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const onKey = (e: KeyboardEvent) => {
      const d = map[e.key];
      if (d && !overlayOpen) {
        e.preventDefault();
        move(d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, overlayOpen]);

  const restart = () => {
    if (hasProgress(useAppStore.getState().session)) setDialog('restart');
    else useAppStore.getState().newGame();
  };

  const hint = useSharedValue(hintMoves < HINT_MOVES ? 1 : 0);
  useEffect(() => {
    hint.set(withTiming(hintMoves < HINT_MOVES ? 1 : 0, { duration: 600 }));
  }, [hintMoves, hint]);
  const hintStyle = useAnimatedStyle(() => ({ opacity: hint.get() }));

  const content = (
    <View style={[styles.column, { paddingHorizontal: layout.screenPadding }]}>
      <View style={styles.topBar}>
        <IconButton icon="back" label={t.game.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <TileLadder />
        <IconButton icon="settings" label={t.game.settings} onPress={() => router.push('/settings')} />
      </View>
      <View style={[styles.stage, { gap: layout.gap }]}>
      <View style={{ width: layout.boardSide, alignSelf: 'center' }}>
        <ScoreHeader />
      </View>
      <View style={styles.boardWrap}>
        <GameBoard ref={boardRef} layout={layout} enabled={!overlayOpen} onIdle={setIdle} />
        <ComboCallout />
      </View>
      <View style={{ width: layout.boardSide, alignSelf: 'center', gap: space[2] }}>
        <GameControls canUndo={session.undo !== null} onUndo={() => useAppStore.getState().undo()} onRestart={restart} onHelp={() => setDialog('help')} />
        <Animated.Text style={[type.caption, styles.hint, hintStyle]} accessibilityElementsHidden={hintMoves >= HINT_MOVES}>
          {t.game.hint}
        </Animated.Text>
        {showPad ? <DirectionPad onMove={move} /> : null}
      </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {layout.needsScroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}

      {dialog === 'restart' ? (
        <ConfirmDialog
          title={t.restart.title}
          body={t.restart.body}
          confirm={t.restart.confirm}
          cancel={t.restart.cancel}
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            useAppStore.getState().newGame();
          }}
        />
      ) : null}
      {dialog === 'help' ? <HowToPlaySheet onClose={() => setDialog(null)} /> : null}
      {showWin && !dialog ? (
        <MilestoneModal
          score={board.score}
          moves={board.moves}
          onKeepGoing={() => useAppStore.getState().dismissWin()}
          onNewGame={() => {
            useAppStore.getState().dismissWin();
            useAppStore.getState().newGame();
          }}
        />
      ) : null}
      {showOver && !dialog ? (
        <GameOverModal
          score={board.score}
          best={stats.bestScore}
          largest={maxTile(board)}
          newBest={isNewBest(session)}
          canUndo={session.undo !== null}
          onPlayAgain={() => useAppStore.getState().newGame()}
          onUndo={() => useAppStore.getState().undo()}
          onHome={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: space[8] },
  column: { flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
  // Optical centre sits a little above the true centre.
  stage: { flex: 1, justifyContent: 'center', paddingBottom: space[4] },
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boardWrap: { alignItems: 'center' },
  hint: { textAlign: 'center', color: colors.text.secondary, minHeight: 18, fontFamily: fonts.bold },
});
