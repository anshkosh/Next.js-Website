import { expect, it } from "vitest";
import { commentLanguageReasons } from "../lib/comment-language";

it.each([
  "This product sucks. I would not pay for it.",
  "Your app is useless. It crashes every time I open it.",
  "This idea is stupid and the design is garbage. Pivot to something customers need.",
  "You should fix this useless onboarding flow.",
  "I would kill this feature and build something people will buy.",
  "Scunthorpe needs a better class booking app.",
  "Yeh product bekaar hai. Main iske liye paise nahi dunga.",
])("allows blunt criticism without flagging product language: %s", text => {
  expect(commentLanguageReasons(text)).toEqual([]);
});

it.each([
  ["You are a useless fraud and an idiot. Nobody with a brain would use this garbage, shut it down.", "personal abuse"],
  ["You're a moron.", "personal abuse"],
  ["Tum ek idiot ho.", "personal abuse"],
  ["तुम बेवकूफ हो।", "personal abuse"],
  ["The founder is an idiot.", "personal abuse"],
  ["I'll kill you.", "threat"],
  ["I'm going to hurt you.", "threat"],
  ["I will find you and hurt you.", "threat"],
  ["You should die.", "threat"],
  ["Tujhe jaan se maar dunga.", "threat"],
  ["तुझे जान से मार दूंगा।", "threat"],
  ["This is fucking broken.", "Profanity"],
  ["This is f.u.c.k.i.n.g broken.", "Profanity"],
  ["What the f**k is this?", "Profanity"],
  ["What the f*ck is this sh*t?", "Profanity"],
  ["यह चूतिया है", "Profanity"],
])("holds abuse, threats or profanity: %s", (text, reason) => {
  expect(commentLanguageReasons(text).some(value => value.includes(reason))).toBe(true);
});
