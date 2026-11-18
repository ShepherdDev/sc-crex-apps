import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { HomeResponse } from "../api/types";
import { NextServicePill } from "../components/NextServicePill";
import { PillButton } from "../components/PillButton";
import { colors, SIDE_MARGIN } from "../config";
import type { Navigate } from "../navigation";
import { ErrorView } from "./ErrorView";
import { scaledStyles } from "../scale";

/**
 * Watch Live when nothing is streaming. (When we're live, the menu item
 * opens the player directly.) If a stream starts while this screen is open,
 * the next refresh swaps in a Join Live button.
 */
export const LiveScreen = ({
  home,
  error,
  reload,
  navigate,
}: {
  home: HomeResponse | null;
  error: string | null;
  reload: () => void;
  navigate: Navigate;
}) => {
  if (!home) {
    return error ? (
      <ErrorView message={error} onRetry={reload} />
    ) : (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const { live, upcoming, hero, generatedAt } = home;

  if (live) {
    return (
      <View style={styles.page}>
        <Text style={styles.eyebrowLive}>LIVE NOW</Text>
        <Text style={styles.title}>{live.title}</Text>
        <View style={styles.buttons}>
          <PillButton
            label="Join Live"
            icon="play"
            primary
            hasTVPreferredFocus
            onPress={() => navigate({ name: "player", live })}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>WATCH LIVE</Text>
      <Text style={styles.title}>We're not live right now</Text>
      {upcoming.length ? (
        <View style={styles.pillRow}>
          <NextServicePill start={upcoming[0].start} now={generatedAt} />
        </View>
      ) : null}
      {hero ? (
        <View style={styles.buttons}>
          <PillButton
            label="Watch the Latest Message"
            icon="play"
            primary
            hasTVPreferredFocus
            hint={`Plays ${hero.title}`}
            onPress={() => navigate({ name: "player", message: hero })}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = scaledStyles({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 140,
    paddingHorizontal: SIDE_MARGIN,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  eyebrow: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 18,
  },
  eyebrowLive: {
    color: colors.text,
    backgroundColor: colors.red,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 72,
    lineHeight: 80,
    fontWeight: "700",
    marginBottom: 28,
  },
  pillRow: { flexDirection: "row", marginBottom: 48 },
  buttons: { flexDirection: "row", marginTop: 48 },
});
