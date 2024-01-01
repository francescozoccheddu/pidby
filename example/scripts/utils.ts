export function today(): string {
  return new Date().toLocaleDateString();
}

export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}