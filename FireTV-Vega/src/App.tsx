import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {colors} from './config';
import type {Navigate, Route} from './navigation';
import {HomeScreen} from './screens/HomeScreen';
import {PlayerScreen} from './screens/PlayerScreen';
import {SeriesListScreen} from './screens/SeriesListScreen';
import {SeriesScreen} from './screens/SeriesScreen';

interface Entry {
  key: number;
  route: Route;
}
let nextKey = 1;

/**
 * A simple screen stack. Screens underneath stay mounted (hidden) so focus
 * and scroll position are where you left them when you press Back.
 * Back on the home screen exits the app.
 */
export const App = () => {
  const [stack, setStack] = useState<Entry[]>([
    {key: 0, route: {name: 'home'}},
  ]);

  const navigate: Navigate = useCallback((route) => {
    setStack((s) => [...s, {key: nextKey++, route}]);
  }, []);
  const pop = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false; // home: let Vega close the app
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  return (
    <View style={styles.root}>
      {stack.map((entry, i) => {
        const active = i === stack.length - 1;
        return (
          <View key={entry.key} style={active ? styles.screen : styles.hidden}>
            {renderRoute(entry.route, navigate, pop, active)}
          </View>
        );
      })}
    </View>
  );
};

function renderRoute(
  route: Route,
  navigate: Navigate,
  pop: () => void,
  active: boolean,
) {
  switch (route.name) {
    case 'home':
      return <HomeScreen navigate={navigate} active={active} />;
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

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  screen: {...StyleSheet.absoluteFillObject},
  hidden: {display: 'none'},
});
