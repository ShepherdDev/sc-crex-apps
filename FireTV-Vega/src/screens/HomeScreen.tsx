import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, ScrollView, Text, View} from 'react-native';
import {imageUrl} from '../api/client';
import {messageMeta, startTimeLabel} from '../api/format';
import type {HomeResponse, Message, Series} from '../api/types';
import {Card} from '../components/Card';
import {NextServicePill} from '../components/NextServicePill';
import {PillButton} from '../components/PillButton';
import {Row} from '../components/Row';
import {colors, SIDE_MARGIN} from '../config';
import {getContinueWatching, Progress} from '../storage/progress';
import type {Navigate} from '../navigation';
import {ErrorView} from './ErrorView';
import {px, scaledStyles} from '../scale';

const HERO_HEIGHT = 652;
const HERO_IMAGE_WIDTH = 1160;

const SHADE_WIDTH = 800;

export const HomeScreen = ({
  home,
  error,
  reload,
  navigate,
  active,
}: {
  home: HomeResponse | null;
  error: string | null;
  reload: () => void;
  navigate: Navigate;
  active: boolean;
}) => {
  const [continueItems, setContinueItems] = useState<Progress[]>([]);
  const scroll = useRef<ScrollView>(null);
  const rowY = useRef<Record<string, number>>({});

  // Refresh Continue Watching whenever we come back to this screen.
  useEffect(() => {
    if (active) {
      getContinueWatching().then(setContinueItems);
    }
  }, [active]);

  const scrollToRow = (id: string) => {
    const y = rowY.current[id];
    if (y !== undefined) {
      scroll.current?.scrollTo({y: Math.max(0, y - px(80)), animated: true});
    }
  };
  const scrollToTop = () => scroll.current?.scrollTo({y: 0, animated: true});

  if (!home) {
    return error ? (
      <ErrorView message={error} onRetry={reload} />
    ) : (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const {live, hero, upcoming, generatedAt} = home;
  const next = upcoming[0];
  const heroImage = imageUrl(hero?.image, HERO_IMAGE_WIDTH);

  const playMessage = (message: Message) => navigate({name: 'player', message});
  const openSeries = (s: Series | string) =>
    navigate({name: 'series', id: typeof s === 'string' ? s : s.id});

  return (
    <ScrollView
      ref={scroll}
      style={styles.page}
      showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={styles.hero}>
        {heroImage ? (
          <Image
            source={{uri: heroImage}}
            aria-label={`${hero?.seriesTitle ?? 'Series'} artwork`}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.heroShade} />
        {/* Smooth fades from the text panel into the art, and into the rows below. */}
        <Image
          source={require('../assets/fade-right.png')}
          style={styles.fadeRight}
          resizeMode="stretch"
        />
        <Image
          source={require('../assets/fade-down.png')}
          style={styles.fadeBottom}
          resizeMode="stretch"
        />

        {/* Countdown to the next stream; hidden while we're live. */}
        {next && !live ? (
          <View style={styles.topBar}>
            <NextServicePill start={next.start} now={generatedAt} />
          </View>
        ) : null}

        <View style={styles.heroText}>
          {live ? (
            <>
              <View style={styles.liveLine}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                </View>
                <Text style={styles.heroMeta}>
                  Started at {startTimeLabel(live.startTime)}
                </Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {live.title}
              </Text>
              <Text style={styles.heroMeta}>
                Streaming live from Shepherd Church
              </Text>
              <View style={styles.heroButtons}>
                <PillButton
                  label="Join Live"
                  icon="play"
                  primary
                  hasTVPreferredFocus
                  onFocus={scrollToTop}
                  onPress={() => navigate({name: 'player', live})}
                />
              </View>
            </>
          ) : hero ? (
            <>
              <Text style={styles.eyebrow}>LATEST MESSAGE</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {[hero.seriesTitle, hero.speaker].filter(Boolean).join(' · ')}
              </Text>
              {hero.description ? (
                <Text style={styles.heroDescription} numberOfLines={3}>
                  {hero.description}
                </Text>
              ) : null}
              <View style={styles.heroButtons}>
                <PillButton
                  label="Watch Now"
                  icon="play"
                  primary
                  hasTVPreferredFocus
                  onFocus={scrollToTop}
                  onPress={() => playMessage(hero)}
                />
                <PillButton
                  label="View Series"
                  onFocus={scrollToTop}
                  onPress={() => openSeries(hero.seriesId)}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>

      {/* Rows */}
      <View onLayout={(e) => (rowY.current.continue = e.nativeEvent.layout.y)}>
        <Row
          title="Continue Watching"
          items={continueItems}
          keyOf={(p) => p.message.id}
          onRowFocus={() => scrollToRow('continue')}
          renderCard={(p, onFocus) => (
            <Card
              image={p.message.image}
              overlayTitle={p.message.title}
              caption={p.message.seriesTitle}
              progress={p.duration > 0 ? p.position / p.duration : undefined}
              accessibilityLabel={`Resume ${p.message.title}`}
              accessibilityHint="Continues playing where you left off"
              onFocus={onFocus}
              onPress={() => playMessage(p.message)}
            />
          )}
        />
      </View>

      {home.rows.map((row) => (
        <View
          key={row.id}
          onLayout={(e) => (rowY.current[row.id] = e.nativeEvent.layout.y)}>
          {row.type === 'messages' ? (
            <Row
              title={row.title}
              items={row.items}
              keyOf={(m) => m.id}
              onRowFocus={() => scrollToRow(row.id)}
              renderCard={(m, onFocus) => (
                <Card
                  image={m.image}
                  overlayTitle={m.title}
                  caption={messageMeta(m.date, m.speaker)}
                  accessibilityLabel={m.title}
                  accessibilityHint="Plays this message"
                  onFocus={onFocus}
                  onPress={() => playMessage(m)}
                />
              )}
            />
          ) : (
            <Row
              title={row.title}
              items={row.items}
              keyOf={(s) => s.id}
              onRowFocus={() => scrollToRow(row.id)}
              renderCard={(s, onFocus) => (
                <Card
                  image={s.image}
                  caption={`${s.title} · ${s.messageCount} message${
                    s.messageCount === 1 ? '' : 's'
                  }`}
                  accessibilityLabel={`${s.title} series`}
                  accessibilityHint="Opens this series"
                  onFocus={onFocus}
                  onPress={() => openSeries(s)}
                />
              )}
            />
          )}
          {row.type === 'series' && row.seeAllUrl ? (
            <View style={styles.seeAll}>
              <PillButton
                label={`See all ${row.title}`}
                onFocus={() => scrollToRow(row.id)}
                onPress={() =>
                  navigate({name: 'seriesList', url: row.seeAllUrl!})
                }
              />
            </View>
          ) : null}
        </View>
      ))}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = scaledStyles({
  page: {flex: 1, backgroundColor: colors.background},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  hero: {height: HERO_HEIGHT, marginBottom: 24},
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: HERO_IMAGE_WIDTH,
    height: HERO_HEIGHT,
  },
  // Solid panel under the text so it stays readable over any artwork.
  heroShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SHADE_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.background,
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    left: SHADE_WIDTH,
    width: 240,
    height: HERO_HEIGHT,
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    right: 96,
    flexDirection: 'row',
  },
  heroText: {position: 'absolute', top: 160, left: SIDE_MARGIN, width: 640},
  eyebrow: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 18,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 84,
    lineHeight: 88,
    fontWeight: '700',
    marginBottom: 18,
  },
  heroMeta: {color: colors.textMuted, fontSize: 28},
  heroDescription: {
    color: '#E3E6EA',
    fontSize: 26,
    lineHeight: 36,
    marginTop: 18,
  },
  heroButtons: {flexDirection: 'row', gap: 20, marginTop: 36},
  liveLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.red,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.text,
  },
  liveBadgeText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
  },
  seeAll: {
    marginLeft: SIDE_MARGIN,
    marginTop: -24,
    marginBottom: 48,
    flexDirection: 'row',
  },
  bottomSpace: {height: 120},
});
