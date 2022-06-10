import * as io from 'io-ts';

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
};

export type ZoomProtocolInput<M extends keyof typeof ZoomProtocolTypeMap> = io.TypeOf<(typeof ZoomProtocolTypeMap)[M]["input"]>;
export type ZoomProtocolOutput<M extends keyof typeof ZoomProtocolTypeMap> = io.TypeOf<(typeof ZoomProtocolTypeMap)[M]["output"]>;

type ZoomProtocol = {
  [M in keyof typeof ZoomProtocolTypeMap]: (
    input: ZoomProtocolInput<M>,
  ) => ZoomProtocolOutput<M>
};

export default ZoomProtocol;
