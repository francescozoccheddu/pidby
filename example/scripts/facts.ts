import { randomInt } from "./utils";

export type Fact = {
  readonly title: string;
  readonly body: string;
}

const facts: readonly Fact[] = [
  { title: "Best Pink Floyd song", body: "Wearing the Inside Out" },
  { title: "Best Jefferson Airplane song", body: "Lather" },
  { title: "Best The Rolling Stones song", body: "No Use In Crying" },
  { title: "Best Edgar Wright movie", body: "The World's End" },
  { title: "Best Tim Burton movie", body: "Ed Wood" },
  { title: "Best Woody Allen movie", body: "Deconstructing Harry" },
  { title: "Best David Fincher movie", body: "Zodiac" },
  { title: "Best pizza flavor", body: "Margherita" },
];

export function randomFact(): Fact {
  return facts[randomInt(facts.length)]!;
}