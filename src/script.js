"use strict";
const elements = {
  rangeInput: document.getElementById("range-input"),
};

// GRADIENT RANGE INPUT UPDATE---------------------------
function updateRangeBackground() {
  const min = elements.rangeInput.min || 0;
  const max = elements.rangeInput.max || 100;
  const value = elements.rangeInput.value;

  //Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;

  // update background gradient
  elements.rangeInput.style.background = `linear-gradient(to right, #a4ffaf 0%, #a4ffaf ${percentage}%, #18171f ${percentage}%, #18171f 100%)`;
}

updateRangeBackground();

// Update when value change
elements.rangeInput.addEventListener("input", updateRangeBackground);
