import {
  messageMeta,
  shortDate,
  startTimeLabel,
  upcomingLabel,
} from "../src/api/format";

describe("date labels (church local time, no time zone shifting)", () => {
  const now = "2026-11-17T16:00:00"; // Tuesday 4 PM

  it("labels a stream later today", () => {
    expect(upcomingLabel("2026-11-17T18:45:00", now)).toBe("Tonight, 6:45 PM");
  });
  it("labels tomorrow", () => {
    expect(upcomingLabel("2026-11-18T18:45:00", now)).toBe("Tomorrow, 6:45 PM");
  });
  it("uses the weekday within a week", () => {
    expect(upcomingLabel("2026-11-21T17:30:00", now)).toBe("Saturday, 5:30 PM");
    expect(upcomingLabel("2026-11-22T08:45:00", now)).toBe("Sunday, 8:45 AM");
  });
  it("uses the date beyond a week", () => {
    expect(upcomingLabel("2026-12-24T15:30:00", now)).toBe("Dec 24, 3:30 PM");
  });
  it("drops :00 minutes", () => {
    expect(startTimeLabel("17:00:00")).toBe("5 PM");
    expect(startTimeLabel("18:45:00")).toBe("6:45 PM");
  });
  it("formats message captions", () => {
    expect(shortDate("2026-11-15T00:00:00")).toBe("Nov 15");
    expect(messageMeta("2026-11-15T00:00:00", "Pastor Dudley Rutherford")).toBe(
      "Nov 15 · Pastor Dudley Rutherford"
    );
    expect(messageMeta("2026-11-15T00:00:00", "")).toBe("Nov 15");
  });
});

describe("next service pill", () => {
  const now = "2026-11-17T16:00:00";
  const { nextServiceLabel } = require("../src/api/format");
  it("counts minutes in the last hour", () => {
    expect(nextServiceLabel("2026-11-17T16:25:00", now)).toEqual({
      lead: "Next service in",
      emphasis: "25 minutes",
    });
    expect(nextServiceLabel("2026-11-17T16:01:00", now).emphasis).toBe(
      "1 minute"
    );
  });
  it("counts whole hours within a day", () => {
    expect(nextServiceLabel("2026-11-17T19:45:00", now).emphasis).toBe(
      "3 hours"
    );
    expect(nextServiceLabel("2026-11-17T17:10:00", now).emphasis).toBe(
      "1 hour"
    );
  });
  it("crosses midnight and month ends", () => {
    expect(
      nextServiceLabel("2026-12-01T08:00:00", "2026-11-30T20:00:00").emphasis
    ).toBe("12 hours");
  });
  it("names the day when more than a day away", () => {
    expect(nextServiceLabel("2026-11-22T08:45:00", now)).toEqual({
      lead: "Next service",
      emphasis: "Sunday, 8:45 AM",
    });
  });
  it("handles a start that just passed", () => {
    expect(nextServiceLabel("2026-11-17T15:59:00", now).emphasis).toBe(
      "starting now"
    );
  });
});

describe("playback time", () => {
  const { playbackTime } = require("../src/api/format");
  it("formats minutes and hours", () => {
    expect(playbackTime(201)).toBe("3:21");
    expect(playbackTime(744)).toBe("12:24");
    expect(playbackTime(3909)).toBe("1:05:09");
    expect(playbackTime(NaN)).toBe("0:00");
  });
});
