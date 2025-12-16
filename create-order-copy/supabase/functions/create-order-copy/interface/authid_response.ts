export interface AuthIdResponse {
  authenticated: boolean;
  authId: string | null;
}
export const AuthIdResponse = {
  fromMap: (map: Record<string, any>): AuthIdResponse => {
    return {
      authenticated: map["authenticated"],
      authId: map["authId"],
    };
  },
};
