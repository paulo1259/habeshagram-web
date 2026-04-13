import { LiveMatch } from "@/types";

const snapshots: LiveMatch[][] = [
  [
    {
      id: "match-1",
      homeTeam: "Manchester United",
      awayTeam: "Chelsea",
      homeScore: 1,
      awayScore: 0,
      status: "LIVE",
      matchClock: "23'",
      venue: "Old Trafford",
      timeline: [
        {
          id: "m1-e1",
          minute: "12'",
          team: "Manchester United",
          type: "goal",
          player: "Rashford",
          description: "Drives inside and finishes low across goal."
        },
        {
          id: "m1-e2",
          minute: "19'",
          team: "Chelsea",
          type: "yellow",
          player: "Caicedo",
          description: "Booked for stopping a quick break."
        }
      ]
    },
    {
      id: "match-2",
      homeTeam: "Arsenal",
      awayTeam: "Manchester City",
      homeScore: 0,
      awayScore: 0,
      status: "HT",
      matchClock: "Half-time",
      venue: "Emirates Stadium",
      timeline: [
        {
          id: "m2-e1",
          minute: "17'",
          team: "Arsenal",
          type: "yellow",
          player: "Rice",
          description: "Late challenge in midfield."
        }
      ]
    }
  ],
  [
    {
      id: "match-1",
      homeTeam: "Manchester United",
      awayTeam: "Chelsea",
      homeScore: 1,
      awayScore: 1,
      status: "LIVE",
      matchClock: "51'",
      venue: "Old Trafford",
      timeline: [
        {
          id: "m1-e1",
          minute: "12'",
          team: "Manchester United",
          type: "goal",
          player: "Rashford",
          description: "Drives inside and finishes low across goal."
        },
        {
          id: "m1-e2",
          minute: "19'",
          team: "Chelsea",
          type: "yellow",
          player: "Caicedo",
          description: "Booked for stopping a quick break."
        },
        {
          id: "m1-e3",
          minute: "49'",
          team: "Chelsea",
          type: "goal",
          player: "Palmer",
          description: "Calm finish after a quick cutback."
        }
      ]
    },
    {
      id: "match-2",
      homeTeam: "Arsenal",
      awayTeam: "Manchester City",
      homeScore: 1,
      awayScore: 0,
      status: "LIVE",
      matchClock: "63'",
      venue: "Emirates Stadium",
      timeline: [
        {
          id: "m2-e1",
          minute: "17'",
          team: "Arsenal",
          type: "yellow",
          player: "Rice",
          description: "Late challenge in midfield."
        },
        {
          id: "m2-e2",
          minute: "57'",
          team: "Arsenal",
          type: "goal",
          player: "Saka",
          description: "Bends one in after a sharp transition."
        }
      ]
    }
  ],
  [
    {
      id: "match-1",
      homeTeam: "Manchester United",
      awayTeam: "Chelsea",
      homeScore: 2,
      awayScore: 1,
      status: "FT",
      matchClock: "Full-time",
      venue: "Old Trafford",
      timeline: [
        {
          id: "m1-e1",
          minute: "12'",
          team: "Manchester United",
          type: "goal",
          player: "Rashford",
          description: "Drives inside and finishes low across goal."
        },
        {
          id: "m1-e2",
          minute: "19'",
          team: "Chelsea",
          type: "yellow",
          player: "Caicedo",
          description: "Booked for stopping a quick break."
        },
        {
          id: "m1-e3",
          minute: "49'",
          team: "Chelsea",
          type: "goal",
          player: "Palmer",
          description: "Calm finish after a quick cutback."
        },
        {
          id: "m1-e4",
          minute: "78'",
          team: "Manchester United",
          type: "goal",
          player: "Hojlund",
          description: "Gets across his marker and heads home."
        }
      ]
    },
    {
      id: "match-2",
      homeTeam: "Arsenal",
      awayTeam: "Manchester City",
      homeScore: 1,
      awayScore: 1,
      status: "FT",
      matchClock: "Full-time",
      venue: "Emirates Stadium",
      timeline: [
        {
          id: "m2-e1",
          minute: "17'",
          team: "Arsenal",
          type: "yellow",
          player: "Rice",
          description: "Late challenge in midfield."
        },
        {
          id: "m2-e2",
          minute: "57'",
          team: "Arsenal",
          type: "goal",
          player: "Saka",
          description: "Bends one in after a sharp transition."
        },
        {
          id: "m2-e3",
          minute: "84'",
          team: "Manchester City",
          type: "goal",
          player: "Foden",
          description: "Slots in after a crowded penalty-box scramble."
        }
      ]
    }
  ]
];

export function getLiveMatchSnapshot(step = 0) {
  return snapshots[step % snapshots.length];
}

export function getInitialLiveMatches() {
  // TODO: Replace these seeded snapshots with a real football live-score API.
  return getLiveMatchSnapshot(0);
}

export function getNextLiveMatches(step: number) {
  // TODO: Keep the UI contract and swap this out for streaming or polling when a live provider is connected.
  return getLiveMatchSnapshot(step);
}
