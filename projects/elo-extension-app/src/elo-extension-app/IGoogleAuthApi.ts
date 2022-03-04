import { GoogleAuthResult } from "../elo-types/GoogleAuthResult";

type IGoogleAuthApi = {
  login(): Promise<GoogleAuthResult>;
  getTokenDetail(token: string): Promise<GoogleAuthResult['detail']>;
  logout(): Promise<void>;
};

export default IGoogleAuthApi;
