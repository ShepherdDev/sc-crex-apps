import React from 'react';
import {AppRegistry, LogBox} from 'react-native';
import {App} from '@shared/App';
import {PlayerScreen} from './src/PlayerScreen';
import {name as appName} from './app.json';

// Temporary workaround for problem with nested text
// not working currently.
LogBox.ignoreAllLogs();

// The app itself lives in ../TV-Shared; Vega supplies its Shaka-based player.
const Main = () => <App PlayerScreen={PlayerScreen} />;

AppRegistry.registerComponent(appName, () => Main);
