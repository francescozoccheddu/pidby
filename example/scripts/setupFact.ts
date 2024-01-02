import { randomFact } from "./facts";

const factEl = document.getElementById("fact");
if (factEl) {
  const fact = randomFact();
  // title
  const factsKeyElement = document.createElement("div");
  factsKeyElement.classList.add("title");
  factsKeyElement.textContent = fact.title;
  factEl.appendChild(factsKeyElement)
  // body  
  const factsValueElement = document.createElement("div");
  factsValueElement.classList.add("body");
  factsValueElement.textContent = fact.body;
  factEl.appendChild(factsValueElement)
}