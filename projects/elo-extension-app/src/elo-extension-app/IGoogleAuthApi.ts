import { GoogleAuthResult } from "../elo-extension-app/Protocol";

type IGoogleAuthApi = {
  login(): Promise<GoogleAuthResult>;
  getTokenDetail(token: string): Promise<GoogleAuthResult['detail']>;
  logout(): Promise<void>;
};

export default IGoogleAuthApi;
