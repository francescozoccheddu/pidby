import { randomFact } from "./facts";

const factEl = document.getElementById("fact");
if (factEl) {
  const fact = randomFact();
  // key  
  const factsKeyElement = document.createElement("div");
  factsKeyElement.classList.add("key");
  factsKeyElement.textContent = fact.key;
  factEl.appendChild(factsKeyElement)
  // value  
  const factsValueElement = document.createElement("div");
  factsValueElement.classList.add("value");
  factsValueElement.textContent = fact.value;
  factEl.appendChild(factsValueElement)
}