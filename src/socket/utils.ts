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

export const countVotes = (record: Record<string, string>, witch?: string) => {
  const votes: Record<string, number> = {};

  Object.values(record).forEach((vote) => {
    if (votes[vote]) votes[vote] += 1;
    else votes[vote] = 1;
  });

  let max = 1;
  let index = -1;
  Object.values(votes).forEach((n, i) => {
    if (n >= max) {
      max = n;
      index = i;
    }
  });

  const even = Object.values(votes).filter((n) => n === max).length > 1;
  const name = Object.keys(votes)[index];
  const res = witch && witch === name ? undefined : name;

  return even ? undefined : res;
};
