import type {LiveStream, Message} from './api/types';

/** Every screen the app can show. The app keeps them in a stack; Back pops it. */
export type Route =
  | {name: 'home'}
  | {name: 'series'; id: string}
  | {name: 'seriesList'; url: string}
  | {name: 'player'; message?: Message; live?: LiveStream};

export type Navigate = (route: Route) => void;
