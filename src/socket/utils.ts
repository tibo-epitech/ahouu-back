/* eslint-disable no-plusplus */
import { Player, PlayerRole } from '../types';

export const getNumberOfWolfs = (size: number): number => {
  if (size >= 12) return 3;
  if (size >= 8) return 2;
  return 1;
};

export const randomisePlayerRoles = (players: Player[]): Array<PlayerRole> => {
  const poll = [...Array(players.length).keys()];
  const roles: Array<PlayerRole> = new Array<PlayerRole>(players.length);
  const distribution = {
    villagers: 1, wolfs: 1, seer: 1, witch: 1,
  };

  function distribute(range: number, role: PlayerRole) {
    [...Array(range).keys()].forEach(() => {
      const rnd = Math.floor(Math.random() * poll.length);
      const roll = poll.splice(rnd, 1)[0];

      roles[roll] = role;
    });
  }

  const size = players.length;
  distribution.wolfs = getNumberOfWolfs(size);
  distribution.villagers = size - distribution.wolfs - distribution.witch - distribution.seer;

  distribute(distribution.villagers, PlayerRole.VILLAGER);
  distribute(distribution.wolfs, PlayerRole.WOLF);
  distribute(distribution.witch, PlayerRole.WITCH);
  distribute(distribution.seer, PlayerRole.SEER);

  return roles;
};

export const countVotes = (record: Record<string, string>): string | undefined => {
  const votes = Object.values(record);

  let mf = 1;
  let m = 0;
  let item;
  for (let i = 0; i < votes.length; i++) {
    for (let j = i; j < votes.length; j++) {
      if (votes[i] === votes[j]) m++;
      if (mf < m) {
        mf = m;
        item = votes[i];
      }
    }
    m = 0;
  }

  return item;
};
