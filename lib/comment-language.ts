// Conservative review hints, not a complete harassment classifier. Product
// criticism (including "sucks", "trash" and "useless") is allowed on its own.
const PERSONAL_ATTACK = [
  /\b(?:you(?:'re| are)?|u(?: r)?|tum|tu|aap)\s+(?:(?:are|ho|hai|ek|an?|such|so|just|complete|total|useless|clueless|incompetent)\s+){0,4}(?:idiot|moron|fool|stupid|dumbass|useless|worthless|loser|clown|fraud|scammer|bewakoof|gadha|chutiya)\b/i,
  /\b(?:founder|founders|developer|developers|team)\s+(?:is|are)\s+(?:(?:an?|such|so|just|complete|total|useless|clueless|incompetent)\s+){0,3}(?:idiots?|morons?|fools?|stupid|losers?|frauds?|scammers?)\b/i,
  /\b(?:nobody|no one)\s+with\s+(?:a\s+)?(?:working\s+)?(?:brain|mind)\b/i,
  /(?:तुम|तू|आप)\s+(?:(?:एक|बहुत|बड़े)\s+){0,3}(?:बेवकूफ|गधे|गधा|चूतिया|निकम्मे|निकम्मा)/u,
];
const THREAT = [
  /\b(?:i|we)(?:['’]ll| will| am going to| are going to| gonna|'m going to|'re going to)\s+(?:(?:find|hunt)\s+you\s+and\s+)?(?:kill|murder|hurt|stab|shoot|beat|rape|burn)\s+(?:you|u|him|her|them|the founder|your family|your house)\b/i,
  /\b(?:i|we)(?:['’]ll| will| am going to| are going to| gonna|'m going to|'re going to)\s+(?:show up|come|turn up)\b.{0,120}\b(?:smash|break|destroy|burn|attack|wreck|damage|vandalize)\b.{0,60}\b(?:your|the)\s+(?:register(?:\s+table)?|desk|shop|store|house|home|booth|equipment|property|car|office|fixture|prototype)\b/i,
  /\b(?:kill yourself|you (?:should|deserve to) die|hope you die|death to you)\b/i,
  /\b(?:watch your back|i know where you live)\b/i,
  /\b(?:jaan se maar|maar (?:dunga|dungi|denge)|goli maar)\b/i,
  /(?:जान\s+से\s+मार|मार\s+(?:दूँगा|दूंगा|दूंगी|देंगे)|गोली\s+मार)/u,
];
// Word boundaries avoid substrings such as "Scunthorpe" and "class". A short
// separator allowance catches common punctuation masking without stripping words.
const PROFANITY = /\b(?:f[\W_]{0,3}[u*][\W_]{0,3}c[\W_]{0,3}k(?:ing|ed|er|s)?|f[\W_]{0,3}[\*]{1,3}[\W_]{0,3}k|s[\W_]{0,3}h[\W_]{0,3}[i*][\W_]{0,3}t(?:ty|s)?|b[i*]tch(?:es)?|assholes?|bastards?|dickheads?|cunts?|motherfuckers?|chutiya|madarchod|bhenchod|behenchod)\b|(?:^|[^\p{L}])(?:चूतिया|मादरचोद|बहनचोद)(?=$|[^\p{L}])/iu;

export function commentLanguageReasons(text: string): string[] {
  const normalized = text.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/’/g, "'");
  const reasons: string[] = [];
  if (THREAT.some(pattern => pattern.test(normalized))) reasons.push("Possible threat; human review required.");
  if (PERSONAL_ATTACK.some(pattern => pattern.test(normalized))) reasons.push("Possible personal abuse; human review required.");
  if (PROFANITY.test(normalized)) reasons.push("Profanity detected; human review required.");
  return reasons;
}

export const COMMENT_LANGUAGE_WARNING = "Criticize the product as bluntly as you need, but remove threats, personal insults and profanity. Comments containing these are held for review. Please rewrite your feedback before submitting.";
