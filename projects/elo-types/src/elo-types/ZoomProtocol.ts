import * as io from 'io-ts';
import * as ioTypes from 'io-ts-types';
import optional from './optional';

export const ZoomProtocolTypeMap = {
  hello: {
    input: io.type({}),
    output: io.type({
      message: io.string,
    }),
  },
  connect: {
    input: io.type({ zoomAuthCode: io.string }),
    output: io.type({}),
  },
  lookupZoomEmail: {
    input: io.type({}),
    output: io.type({
      zoomEmail: optional(io.string),
    }),
  },
  presence: {
    input: io.type({
      longPoll: optional(io.type({
        differentFrom: optional(io.string),
      })),
    }),
    output: io.union([
      io.type({
        connected: io.literal(false),
      }),
      io.type({
        connected: io.literal(true),
        presence: optional(io.type({
          value: io.string,
          lastUpdated: ioTypes.date,
        })),
      }),
      io.literal('please-retry'),
    ]),
  },
};

export type ZoomProtocolInput<M extends keyof typeof ZoomProtocolTypeMap> = io.TypeOf<(typeof ZoomProtocolTypeMap)[M]["input"]>;
export type ZoomProtocolOutput<M extends keyof typeof ZoomProtocolTypeMap> = io.TypeOf<(typeof ZoomProtocolTypeMap)[M]["output"]>;

type ZoomProtocol = {
  [M in keyof typeof ZoomProtocolTypeMap]: (
    input: ZoomProtocolInput<M>,
  ) => ZoomProtocolOutput<M>
};

export default ZoomProtocol;
