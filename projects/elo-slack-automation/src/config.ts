const rawConfig = require('../../config.json');

export const port: number = rawConfig.port;
export const slackToken: string = rawConfig.slackToken;
export const feedbackChannel: string = rawConfig.feedbackChannel;
export const userIdGenerationSecret: string = rawConfig.userIdGenerationSecret;
