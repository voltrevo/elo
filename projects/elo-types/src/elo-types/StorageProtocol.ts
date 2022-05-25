import * as io from 'io-ts';

import ioBuffer from '../common-pure/ioBuffer';

import permissiveOptional from './permissiveOptional';

export const SetCommand = io.type({
  collectionId: io.string,
  elementId: io.string,
  element: permissiveOptional(ioBuffer),
});

export type SetCommand = io.TypeOf<typeof SetCommand>;

export const StorageProtocolTypeMap = {
  get: {
    input: io.type({
      collectionId: io.string,
      elementId: io.string,
    }),
    output: io.type({
      element: permissiveOptional(ioBuffer),
    }),
  },
  set: {
    input: SetCommand,
    output: io.type({}),
  },
  setMulti: {
    input: io.type({
      commands: io.array(SetCommand),
    }),
    output: io.type({}),
  },
  getRange: {
    input: io.type({
      collectionId: io.string,
      minElementId: permissiveOptional(io.string),
      maxElementId: permissiveOptional(io.string),
      offset: permissiveOptional(io.number),
      direction: io.union([io.literal('ascending'), io.literal('descending')]),
    }),
    output: io.type({
      entries: io.array(io.tuple([io.string, ioBuffer])),
      nextElementId: permissiveOptional(io.string),
    }),
  },
  count: {
    input: io.type({
      collectionId: io.string,
    }),
    output: io.type({
      count: io.number,
    }),
  },
  UsageInfo: {
    input: io.type({}),
    output: io.type({
      used: io.number,
      capacity: io.number,
      unit: io.string,
    }),
  },
};

export type StorageProtocolInput<M extends keyof typeof StorageProtocolTypeMap> = io.TypeOf<(typeof StorageProtocolTypeMap)[M]["input"]>;
export type StorageProtocolOutput<M extends keyof typeof StorageProtocolTypeMap> = io.TypeOf<(typeof StorageProtocolTypeMap)[M]["output"]>;

type StorageProtocol = {
  [M in keyof typeof StorageProtocolTypeMap]: (
    input: StorageProtocolInput<M>,
  ) => StorageProtocolOutput<M>
};

export default StorageProtocol;
