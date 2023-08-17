import { selector } from "recoil";
import { inPcChatWith } from "../Atoms/inChatWith";

export const userChatWith = selector({
  key: "userChatWith",
  get: ({ get }) => {
    const user = get(inPcChatWith);
    return user;
  },
});
