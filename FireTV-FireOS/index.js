import React from 'react';
import {AppRegistry} from 'react-native';
import {App} from '@shared/App';
import {PlayerScreen} from './src/PlayerScreen';
import {name as appName} from './app.json';

// The app itself lives in ../TV-Shared; Fire OS supplies its ExoPlayer-based player.
const Main = () => <App PlayerScreen={PlayerScreen} />;

AppRegistry.registerComponent(appName, () => Main);
