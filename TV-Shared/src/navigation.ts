import type React from "react";
import type { LiveStream, Message } from "./api/types";

/** The four places in the side menu. Each one starts its own screen stack. */
export type Section = "home" | "live" | "series" | "groups";

/** Every screen the app can show. The app keeps them in a stack; Back pops it. */
export type Route =
  | { name: "home" }
  | { name: "live" }
  | { name: "series"; id: string }
  | { name: "seriesList"; url: string }
  | { name: "player"; message?: Message; live?: LiveStream };

export type Navigate = (route: Route) => void;

/** Each platform supplies its own full-screen player with these props. */
export interface PlayerScreenProps {
  message?: Message;
  live?: LiveStream;
  onFinished: () => void;
}
export type PlayerScreenComponent = React.ComponentType<PlayerScreenProps>;
