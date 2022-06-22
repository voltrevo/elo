import * as io from 'io-ts';

export const Config = io.type({});

export type Config = io.TypeOf<typeof Config>;

export default Config;
