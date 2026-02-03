"use strict";

function updateValue(input) {
  document.getElementById("value").textContent = input.value;
  // Calculate progress percentage
  const progress = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--progress", progress + "%");
}

// Initialize on load
const rangeInput = document.getElementById("rangeInput");
updateValue(rangeInput);
