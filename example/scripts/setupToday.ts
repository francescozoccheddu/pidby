import { today } from "./utils";

const todayEl = document.getElementById("today")
if (todayEl) {
  todayEl.textContent = today();
}