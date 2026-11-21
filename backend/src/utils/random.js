import { randomInt as secureRandomInt } from "node:crypto";

export function randomIndex(length, randomInt = secureRandomInt) {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("Cannot select an item from an empty collection.");
  }
  return randomInt(length);
}

export function pickOne(items, randomInt = secureRandomInt) {
  return items[randomIndex(items.length, randomInt)];
}

export function pickDistinct(items, count, randomInt = secureRandomInt) {
  if (!Array.isArray(items) || !Number.isInteger(count) || count < 0 || items.length < count) {
    throw new RangeError("Not enough distinct items are available.");
  }
  const copy = [...items];
  for (let index = 0; index < count; index += 1) {
    const offset = randomIndex(copy.length - index, randomInt);
    const selectedIndex = index + offset;
    [copy[index], copy[selectedIndex]] = [copy[selectedIndex], copy[index]];
  }
  return copy.slice(0, count);
}
