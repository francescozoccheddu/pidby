import { randomInt } from "./utils";

export type Fact = {
  readonly key: string;
  readonly value: string;
}

const facts: readonly Fact[] = [
  { key: "Best Pink Floyd song", value: "Wearing the Inside Out" },
  { key: "Best Edgar Wright movie", value: "The World's End" },
  { key: "Best pizza flavor", value: "Margherita" }
];

export function randomFact(): Fact {
  return facts[randomInt(facts.length)]!;
}