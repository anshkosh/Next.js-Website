import { expect, it } from "vitest";
import { commentLanguageReasons } from "../lib/comment-language";

it.each([
  "This product sucks. I would not pay for it.",
  "Your app is useless. It crashes every time I open it.",
  "This idea is stupid and the design is garbage. Pivot to something customers need.",
  "You should fix this useless onboarding flow.",
  "You are building a useless product with a clueless onboarding flow.",
  "Your fraud detection product is useless and the design is garbage.",
  "The team is building a complete fraud detection workflow.",
  "This product is useless right now; the team should rethink the problem instead of putting a volunteer with a paper register in a ward office.",
  "I would kill this feature and build something people will buy.",
  "Scunthorpe needs a better class booking app.",
  "Yeh product bekaar hai. Main iske liye paise nahi dunga.",
])("allows blunt criticism without flagging product language: %s", text => {
  expect(commentLanguageReasons(text)).toEqual([]);
});

it.each([
  ["You are a useless fraud and an idiot. Nobody with a brain would use this garbage, shut it down.", "personal abuse"],
  ["You're a moron.", "personal abuse"],
  ["[MODTEST-R3 #3] You are a clueless fraud and a complete idiot, nobody with a working brain would trust an incompetent clown like you.", "personal abuse"],
  ["You are a clueless fraud.", "personal abuse"],
  ["You're an incompetent clown.", "personal abuse"],
  ["The founder is a clueless fraud.", "personal abuse"],
  ["Nobody with a working brain would trust an incompetent clown like you.", "personal abuse"],
  ["Tum ek idiot ho.", "personal abuse"],
  ["तुम बेवकूफ हो।", "personal abuse"],
  ["The founder is an idiot.", "personal abuse"],
  ["I'll kill you.", "threat"],
  ["I'm going to hurt you.", "threat"],
  ["I will find you and hurt you.", "threat"],
  ["Shut down this fake WardDesk pilot right now or we will show up at the test booth and smash your register table.", "threat"],
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
