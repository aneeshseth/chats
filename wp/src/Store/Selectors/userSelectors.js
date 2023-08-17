import { selector } from "recoil";
import { userState } from "../Atoms/user";

export const userEmail = selector({
  key: "userEmail",
  get: ({ get }) => {
    const user = get(userState);
    if (user.email) {
      return user.email;
    }
  },
});

export const userPassword = selector({
  key: "userPassword",
  get: ({ get }) => {
    const user = get(userState);
    if (user.password) {
      return user.password;
    }
  },
});

export const username = selector({
  key: "userName",
  get: ({ get }) => {
    const user = get(userState);
    if (user.username) {
      return user.username;
    }
  },
});

export const userPFP = selector({
  key: "userPFP",
  get: ({ get }) => {
    const user = get(userState);
    if (user.image) {
      return user.image;
    }
  },
});
