import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, BackHandler, StyleSheet, View} from 'react-native';
import type {HomeResponse} from './api/types';
import {SideMenu} from './components/SideMenu';
import {colors, MENU_WIDTH} from './config';
import {useHome} from './hooks/useHome';
import type {
  Navigate,
  PlayerScreenComponent,
  Route,
  Section,
} from './navigation';
import {HomeScreen} from './screens/HomeScreen';
import {LiveScreen} from './screens/LiveScreen';
import {SeriesListScreen} from './screens/SeriesListScreen';
import {SeriesScreen} from './screens/SeriesScreen';
import {scaledStyles, setScreenWidth} from './scale';

interface Entry {
  key: number;
  route: Route;
}
let nextKey = 1;

/** The first screen of each menu section. */
function rootRoute(section: Section): Route {
  switch (section) {
    case 'home':
      return {name: 'home'};
    case 'live':
      return {name: 'live'};
    case 'series':
      return {name: 'seriesList', url: 'sermons'};
    case 'groups':
      return {name: 'seriesList', url: 'lifegroups'};
  }
}

/**
 * Side menu plus a screen stack for the current section. Screens underneath
 * stay mounted (hidden) so focus and scroll are where you left them.
 *
 * Back button:
 *  1. On a pushed screen (a series, the player): go back one screen.
 *  2. On a section's first screen: move focus to the menu.
 *  3. In the menu, on any section but Home: go to Home.
 *  4. In the menu on Home: exit the app.
 */
export const App = ({
  PlayerScreen,
}: {
  /** The platform's video player (Shaka on Vega, ExoPlayer on Fire OS). */
  PlayerScreen: PlayerScreenComponent;
}) => {
  const [section, setSection] = useState<Section>('home');
  const [stack, setStack] = useState<Entry[]>([
    {key: 0, route: rootRoute('home')},
  ]);
  const [focusRequest, setFocusRequest] = useState(0);
  // Measure the real drawing area before showing anything (see scale.ts).
  const [measured, setMeasured] = useState(false);
  const menuFocused = useRef(false);

  const top = stack[stack.length - 1].route;
  const playing = top.name === 'player';
  const {home, error, reload} = useHome(playing);

  // The menu is hidden during playback, so it can't report losing focus.
  // Reset its state so leaving the player doesn't pull focus into the menu.
  useEffect(() => {
    if (playing) {
      menuFocused.current = false;
      setFocusRequest(0);
    }
  }, [playing]);

  // Amazon requires apps to release the video player when sent to the
  // background (Home button, another app, TV off). Close the player; the
  // position is saved on the way out, so Continue Watching picks it up.
  useEffect(() => {
    if (!playing) {
      return;
    }
    const sub = AppState.addEventListener('change', (next) => {
      console.log(`[app] state ${next}`);
      if (next === 'background') {
        setStack((s) =>
          s[s.length - 1].route.name === 'player' ? s.slice(0, -1) : s,
        );
      }
    });
    return () => sub.remove();
  }, [playing]);

  const navigate: Navigate = useCallback((route) => {
    setStack((s) => [...s, {key: nextKey++, route}]);
  }, []);
  const pop = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );

  const selectSection = useCallback(
    (next: Section) => {
      // When we're live, Watch Live goes straight to the stream.
      if (next === 'live' && home?.live) {
        navigate({name: 'player', live: home.live});
        return;
      }
      setSection(next);
      setStack([{key: nextKey++, route: rootRoute(next)}]);
    },
    [home?.live, navigate],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
      } else if (!menuFocused.current) {
        setFocusRequest((n) => n + 1);
      } else if (section !== 'home') {
        selectSection('home');
      } else {
        return false; // let Vega close the app
      }
      return true;
    });
    return () => sub.remove();
  }, [stack.length, section, pop, selectSection]);

  if (!measured) {
    return (
      <View
        style={styles.root}
        onLayout={(e) => {
          setScreenWidth(e.nativeEvent.layout.width);
          setMeasured(true);
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {playing ? null : (
        <SideMenu
          current={section}
          isLive={!!home?.live}
          onSelect={selectSection}
          onFocusChange={(inMenu) => (menuFocused.current = inMenu)}
          focusRequest={focusRequest}
        />
      )}
      {/* Plain view: a focus guide here remembered cards from screens that
          were replaced when switching sections, and trapped focus in the menu. */}
      <View style={[styles.content, playing && styles.fullScreen]}>
        {stack.map((entry, i) => {
          const active = i === stack.length - 1;
          return (
            <View
              key={entry.key}
              style={active ? styles.screen : styles.hidden}>
              {renderRoute(entry.route, {
                navigate,
                pop,
                active,
                home,
                error,
                reload,
                PlayerScreen,
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};

function renderRoute(
  route: Route,
  ctx: {
    navigate: Navigate;
    pop: () => void;
    active: boolean;
    home: HomeResponse | null;
    error: string | null;
    reload: () => void;
    PlayerScreen: PlayerScreenComponent;
  },
) {
  const {navigate, pop, active, home, error, reload, PlayerScreen} = ctx;
  switch (route.name) {
    case 'home':
      return (
        <HomeScreen
          home={home}
          error={error}
          reload={reload}
          navigate={navigate}
          active={active}
        />
      );
    case 'live':
      return (
        <LiveScreen
          home={home}
          error={error}
          reload={reload}
          navigate={navigate}
        />
      );
    case 'series':
      return <SeriesScreen id={route.id} navigate={navigate} />;
    case 'seriesList':
      return <SeriesListScreen url={route.url} navigate={navigate} />;
    case 'player':
      return (
        <PlayerScreen
          message={route.message}
          live={route.live}
          onFinished={pop}
        />
      );
  }
}

const styles = scaledStyles({
  root: {flex: 1, backgroundColor: colors.background},
  content: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: MENU_WIDTH,
    overflow: 'hidden',
  },
  fullScreen: {left: 0},
  screen: {...StyleSheet.absoluteFillObject},
  hidden: {display: 'none'},
});
