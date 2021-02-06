/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import http from 'http';
import { Socket, Server } from 'socket.io';

import fbworker from '../dbWorker';
import {
  RoomEvents,
  RoomActions,
  Message,
  SocketAuth,
  Room,
  PlayerRole,
  PlayerState,
  Player,
  RoomState,
  MessageType,
  MessageEvents,
  RoomTurn,
} from '../types';
import { GenerateRandomID } from '../utils';
import SocketMiddleware from './middleware';
import { countVotes, getNumberOfWolfs, randomisePlayerRoles } from './utils';

type SocketContext = {
  io: Server
  auth: SocketAuth
  socket: Socket
  on: (event: RoomActions, listener: (...args: any[]) => void) => void
  emit: (event: RoomEvents, ...args: any[]) => void
  emitToSelf: (event: RoomEvents, ...args: any[]) => void
  emitToUser: (username: string, event: RoomEvents, ...args: any[]) => void
  emitNewTurn: (username: string, event: RoomEvents, turn: RoomTurn, ...args: any[]) => void
};

async function join({
  socket, auth: { user, room }, emit,
}: SocketContext) {
  await socket.join([room.id, user.username]);

  let adminChange = false;
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  let player = data.players.find((p) => p.username === user.username);

  if (data.state === RoomState.LOBBY) {
    if (!player) {
      player = {
        username: user.username,
        role: PlayerRole.NONE,
        state: PlayerState.WAITING_IN_LOBBY,
        messages: [],
        connected: true,
      };

      if (user.picture) player.picture = user.picture;
      data.players.push(player);
    }

    if (!data.admin) {
      adminChange = true;
      data.admin = user.username;
    }

    await snap.ref.set(data);

    emit('user-joined', data.players);
    if (adminChange) emit('admin-change', data.admin);
  }

  if (data.state === RoomState.STARTED) {
    if (!player) return;
    player.connected = true;

    if (!data.admin) {
      adminChange = true;
      data.admin = user.username;
    }

    await snap.ref.set(data);

    emit('user-joined', data.players);
    if (adminChange) emit('admin-change', data.admin);
  }
}

async function onDisconnecting({
  socket, auth: { room, user }, emit, emitToUser, emitNewTurn,
}: SocketContext) {
  let adminChange = false;
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  if (data.state === RoomState.LOBBY) {
    data.players = data.players.filter((player) => player.username !== user.username);

    if (data.admin === user.username) {
      adminChange = true;
      data.admin = data.players.length > 0
        ? data.admin = data.players[0].username
        : undefined;
    }

    await snap.ref.set(data);

    emit('user-leaved', data.players);
    if (adminChange) emit('admin-change', data.admin);
  }

  if (data.state === RoomState.STARTED) {
    const player = data.players.find((p) => p.username === user.username) as Player;
    player.connected = false;

    if (data.admin === user.username) {
      adminChange = true;
      const admin = data.players.find((p) => p.username !== user.username);
      data.admin = admin ? admin.username : undefined;

      data.players = data.players.map((p) => {
        p.messages.push(({
          id: GenerateRandomID(),
          type: MessageType.SYSTEM_GENERAL,
          timestamp: Date.now(),
          content: MessageEvents.NEW_ADMIN,
          payload: { admin: data.admin as string },
        }));

        return p;
      });
    }

    await snap.ref.set(data);

    emit('user-leaved', data.players);
    if (adminChange) {
      emit('admin-change', data.admin);
      data.players.forEach((p) => emitToUser(p.username, 'new-message', p.messages));
      if (data.admin && data.adminTurn !== 'none') {
        emitNewTurn(data.admin, 'your-turn',
          data.adminTurn === 'init' || data.adminTurn === 'sleep'
            ? 'put-to-sleep'
            : 'launch-vote');
      }
    }

    socket.disconnect();
  }
}

async function onKickUser({ auth: { room, user }, emit }: SocketContext, username: string) {
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  if (data.state !== RoomState.LOBBY
    || user.username !== data.admin
    || user.username === username
    || !data.players.find((p) => p.username === username)
  ) return;

  data.players = data.players.filter((p) => p.username !== username);

  await snap.ref.set(data);

  emit('user-kicked', data.players);
}

async function onMessage({
  auth: { room, user },
  emitToSelf,
  emitToUser,
}: SocketContext, message: Message) {
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  if (data.state !== RoomState.STARTED) return;
  if (message.type !== MessageType.GENERAL && message.type !== MessageType.WOLF) return;

  const payload: Message = {
    ...message,
    id: GenerateRandomID(),
    username: user.username,
    timestamp: Date.now(),
  };

  data.players = data.players.map((player) => {
    if (player.username === user.username
      || payload.type === MessageType.GENERAL
      || (payload.type === MessageType.WOLF
        && player.role === PlayerRole.WOLF)) {
      player.messages.push(payload);
    }

    return player;
  });

  await snap.ref.set(data);

  data.players.forEach((player) => (player.username === user.username
    ? emitToSelf('new-message', player.messages)
    : emitToUser(player.username, 'new-message', player.messages)));
}

async function onGameStart({ auth: { room, user }, emit }: SocketContext) {
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  if (user.username !== data.admin) return;
  if (data.players.length !== room.max) return;

  const roles = randomisePlayerRoles(data.players);

  data.adminTurn = 'init';
  data.state = RoomState.STARTED;
  data.players = data.players.map((player, i) => {
    const role = roles[i];

    return {
      ...player,
      role,
      state: PlayerState.AWAKE,
      potion: role === PlayerRole.WITCH ? true : undefined,
      messages: [
        {
          id: GenerateRandomID(),
          type: MessageType.SYSTEM_GENERAL,
          timestamp: Date.now(),
          content: MessageEvents.INITIAL_ADMIN,
          payload: { admin: data.admin as string },
        },
        {
          id: GenerateRandomID(),
          type: MessageType.SYSTEM_GENERAL,
          timestamp: Date.now(),
          content: MessageEvents.NUMBER_OF_WOLFS,
          payload: {
            wolfs: getNumberOfWolfs(room.max).toString(),
          } as Record<string, string>,
        },
        {
          id: GenerateRandomID(),
          type: MessageType.SYSTEM_GENERAL,
          timestamp: Date.now(),
          content: MessageEvents.ADMIN_START_GAME,
        },
      ],
    };
  });

  await snap.ref.set(data);

  emit('game-started');

  if (data.state !== RoomState.STARTED || user.username !== data.admin) return;

  data.adminTurn = 'none';
  data.players = data.players.map((player) => {
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.VILLAGE_SLEEPING,
    });

    return { ...player, state: PlayerState.SLEEPING };
  });

  await snap.ref.set(data);
  emit('village-sleeps', data);

  const seer = data.players.find((player) => player.role === PlayerRole.SEER) as Player;

  data.players = data.players.map((player) => {
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.SEER_WAKES_UP,
    });

    if (player.username === seer.username) {
      player.state = PlayerState.ROLE_BASED_ACTION;
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_SELF,
        content: MessageEvents.SEER_SELECT_CHOICE,
      });
    }

    return player;
  });

  await snap.ref.set(data);
  emit('seer-wakes-up', data);
}

async function onSeerVote({ auth: { room }, emit }: SocketContext, vote: string) {
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  const villager = data.players.find((player) => player.username === vote) as Player;
  const seer = data.players.find((player) => player.role === PlayerRole.SEER) as Player;

  seer.state = PlayerState.SLEEPING;
  seer.messages.push({
    id: GenerateRandomID(),
    timestamp: Date.now(),
    type: MessageType.SYSTEM_SELF,
    content: MessageEvents.SEER_RESULT,
    payload: { username: vote, role: villager.role },
  });

  data.players = data.players.map((player) => {
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.SEER_SLEEPS,
    });

    return player;
  });

  await snap.ref.set(data);
  emit('seer-sleeps', data);

  data.players = data.players.map((player) => {
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.WOLFS_WAKES_UP,
    });

    if (player.role === PlayerRole.WOLF) {
      player.state = PlayerState.ROLE_BASED_ACTION;
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_SELF,
        content: MessageEvents.WOLFS_SELECT_CHOICE,
      });
    }

    return player;
  });

  await snap.ref.set(data);
  emit('wolfs-wakes-up', data);
}

async function onWolfVote(context: SocketContext, vote: string) {
  const { auth: { room, user }, emit } = context;

  let snap = await fbworker.rooms.doc(room.id).get();
  let data = snap.data() as Room;

  const max = data.players.filter((player) => player.role === PlayerRole.WOLF
  && player.state !== PlayerState.DEAD).length;

  data.votes.wolfs[user.username] = vote;
  await snap.ref.set(data);

  if (Object.keys(data.votes.wolfs).length !== max) return;

  snap = await fbworker.rooms.doc(room.id).get();
  data = snap.data() as Room;

  data.players = data.players.map((player) => {
    if (player.role === PlayerRole.WOLF) player.state = PlayerState.SLEEPING;
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.WOLF_SLEEPS,
    });

    return player;
  });

  await snap.ref.set(data);
  emit('wolfs-sleeps', data);

  const witch = data.players.find((player) => player.role === PlayerRole.WITCH
  && player.state !== PlayerState.DEAD);

  if (!witch || !witch.potion) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    await villageAwakes(context);
    return;
  }

  data.players = data.players.map((player) => {
    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.WITCH_WAKES_UP,
    });

    if (player.role === PlayerRole.WITCH) {
      player.state = PlayerState.ROLE_BASED_ACTION;
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_SELF,
        content: MessageEvents.WITCH_SELECT_CHOICE,
      });
    }

    return player;
  });

  await snap.ref.set(data);
  emit('witch-wakes-up', data);
}

async function onWitchVote(context: SocketContext, vote: string) {
  const { auth: { room }, emit } = context;

  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  if (vote) data.votes.witch = vote;
  data.players = data.players.map((player) => {
    if (player.role === PlayerRole.WITCH) {
      player.state = PlayerState.SLEEPING;
      player.potion = undefined;
    }

    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.WITCH_SLEEPS,
    });

    return player;
  });

  await snap.ref.set(data);
  emit('witch-sleeps', data);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await villageAwakes(context);
}

async function villageAwakes({ auth: { room }, emit }: SocketContext) {
  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  const res = countVotes(data.votes.wolfs, data.votes.witch);

  const witchKeepsPotion = !res;

  data.adminTurn = 'vote';
  data.votes.witch = undefined;
  data.votes.wolfs = {};
  data.votes.villagers = {};
  data.players = data.players.map((player) => {
    if (player.username === res) {
      player.state = PlayerState.DEAD;
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_SELF,
        content: MessageEvents.YOU_DIED,
        payload: { by: 'wolfs' },
      });
    } else if (player.state !== PlayerState.DEAD) player.state = PlayerState.VOTING;

    if (player.state !== PlayerState.DEAD
      && player.role === PlayerRole.WITCH
      && witchKeepsPotion) player.potion = true;

    player.messages.push({
      id: GenerateRandomID(),
      timestamp: Date.now(),
      type: MessageType.SYSTEM_GENERAL,
      content: MessageEvents.VILLAGE_WAKES_UP,
      payload: { killed: '1' },
    });

    if (res) {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.PLAYER_DIED,
        payload: { player: res, by: 'wolfs' },
      });
    } else {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.NO_ONE_DIED,
      });
    }

    return player;
  });

  const wolfs = data.players.find((player) => player.role === PlayerRole.WOLF
  && player.state !== PlayerState.DEAD);

  const villagers = data.players.find((player) => player.role !== PlayerRole.WOLF
  && player.state !== PlayerState.DEAD);

  if (!wolfs || !villagers) {
    data.state = RoomState.FINISHED;
    data.players = data.players.map((player) => {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: !villagers
          ? MessageEvents.WOLF_WIN
          : MessageEvents.VILLAGE_WIN,
      });

      return player;
    });

    await snap.ref.set(data);
    emit('game-ended', data);

    return;
  }

  data.players = data.players.map((player) => {
    player.messages.push(({
      id: GenerateRandomID(),
      type: MessageType.SYSTEM_SELF,
      timestamp: Date.now(),
      content: MessageEvents.PLAYER_VOTE,
    }));

    return player;
  });

  await snap.ref.set(data);
  emit('village-awakes', data);
}

async function onUserVote(context: SocketContext, vote: string) {
  const { auth: { room, user }, emit } = context;

  const snap = await fbworker.rooms.doc(room.id).get();
  const data = snap.data() as Room;

  data.votes.villagers[user.username] = vote;
  await snap.ref.set(data);

  const max = data.players.filter((player) => player.state !== PlayerState.DEAD).length;

  if (Object.keys(data.votes.villagers).length !== max) return;

  const res = countVotes(data.votes.villagers);

  data.votes.witch = undefined;
  data.votes.wolfs = {};
  data.votes.villagers = {};
  data.players = data.players.map((player) => {
    if (player.username === res) {
      player.state = PlayerState.DEAD;
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_SELF,
        content: MessageEvents.YOU_DIED,
        payload: { by: 'villagers' },
      });
    } else if (player.state !== PlayerState.DEAD) player.state = PlayerState.SLEEPING;

    if (res) {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.PLAYER_DIED,
        payload: { player: res, by: 'villagers' },
      });
    } else {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.NO_ONE_DIED,
      });
    }

    return player;
  });

  const wolfs = data.players.find((player) => player.role === PlayerRole.WOLF
  && player.state !== PlayerState.DEAD);

  const villagers = data.players.find((player) => player.role !== PlayerRole.WOLF
  && player.state !== PlayerState.DEAD);

  // const setWinnerOrLooser = (winner: 'wolfs' | 'villagers', player: Player): PlayerState => {
  //   if (winner === 'wolfs' && player.role === PlayerRole.WOLF) return PlayerState.WINNER;
  //   if (winner !== 'wolfs' && player.role === PlayerRole.WOLF) return PlayerState.LOOSER;
  //   if (winner === 'villagers' && player.role !== PlayerRole.WOLF) return PlayerState.WINNER;
  //   if (winner !== 'villagers' && player.role !== PlayerRole.WOLF) return PlayerState.LOOSER;

  //   return PlayerState.WINNER;
  // };

  if (!wolfs || !villagers) {
    data.state = RoomState.FINISHED;
    data.players = data.players.map((player) => {
      // player.state = setWinnerOrLooser(!wolfs ? 'villagers' : 'villagers', player);
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: !villagers
          ? MessageEvents.WOLF_WIN
          : MessageEvents.VILLAGE_WIN,
      });

      return player;
    });

    await snap.ref.set(data);
    emit('game-ended', data);

    return;
  }

  data.players = data.players.map((player) => {
    player.messages.push(({
      id: GenerateRandomID(),
      type: MessageType.SYSTEM_GENERAL,
      timestamp: Date.now(),
      content: MessageEvents.VILLAGE_SLEEPING,
    }));

    return player;
  });

  await snap.ref.set(data);
  emit('village-sleeps', data);

  const seer = data.players.find((player) => player.role === PlayerRole.SEER
  && player.state !== PlayerState.DEAD);

  if (seer) {
    data.players = data.players.map((player) => {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.SEER_WAKES_UP,
      });

      if (player.username === seer.username) {
        player.state = PlayerState.ROLE_BASED_ACTION;
        player.messages.push({
          id: GenerateRandomID(),
          timestamp: Date.now(),
          type: MessageType.SYSTEM_SELF,
          content: MessageEvents.SEER_SELECT_CHOICE,
        });
      }

      return player;
    });

    await snap.ref.set(data);
    emit('seer-wakes-up', data);
  } else {
    data.players = data.players.map((player) => {
      player.messages.push({
        id: GenerateRandomID(),
        timestamp: Date.now(),
        type: MessageType.SYSTEM_GENERAL,
        content: MessageEvents.WOLFS_WAKES_UP,
      });

      if (player.role === PlayerRole.WOLF) {
        player.state = PlayerState.ROLE_BASED_ACTION;
        player.messages.push({
          id: GenerateRandomID(),
          timestamp: Date.now(),
          type: MessageType.SYSTEM_SELF,
          content: MessageEvents.WOLFS_SELECT_CHOICE,
        });
      }

      return player;
    });

    await snap.ref.set(data);
    emit('wolfs-wakes-up', data);
  }
}

export default (server: http.Server): Server => {
  const io = new Server(server, { cors: { origin: '*' } });

  io.use(SocketMiddleware);

  io.on('connection', (socket: Socket) => {
    const auth = socket.handshake.auth as SocketAuth;

    const context: SocketContext = {
      io,
      auth,
      socket,
      on: (event, listener) => socket.on(event, listener),
      emit: (event, ...args) => io.in(auth.room.id).emit(event, ...args),
      emitToSelf: (event, ...args) => socket.emit(event, ...args),
      emitToUser: (username, event, ...args) => socket.to(username).emit(event, ...args),
      emitNewTurn: (
        username,
        event,
        turn,
        ...args
      ) => socket.to(username).emit(event, turn, ...args),
    };

    join(context)
      .then(() => {
        context.on('user-vote', (vote: string) => onUserVote(context, vote));
        context.on('witch-vote', (vote: string) => onWitchVote(context, vote));
        context.on('wolf-vote', (vote: string) => onWolfVote(context, vote));
        context.on('seer-vote', (vote: string) => onSeerVote(context, vote));
        context.on('send-message', (message: Message) => onMessage(context, message));
        context.on('game-start', () => onGameStart(context));
        context.on('kick-user', (username: string) => onKickUser(context, username));
        context.on('disconnecting', () => onDisconnecting(context));
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e));
  });

  return io;
};
