"use strict";

// ============================================
// Configuration & Constants
// ============================================
const CONFIG = {
  PASSWORD_LENGTH: {
    MIN: 0,
    MAX: 16,
    DEFAULT: 0,
  },
  STRENGTH_THRESHOLDS: {
    TOO_WEAK: { min: 1, max: 4 },
    WEAK: { min: 5, max: 8 },
    MEDIUM: { min: 9, max: 12 },
    STRONG: { min: 13, max: 16 },
  },
  COPIED_MESSAGE_DURATION: 700,
};

const CHARACTERS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const CSS_CLASSES = {
  hidden: "hidden",
  emptyEvalBox: ["border-grey-200", "bg-grey-850"],
  fullEvalBoxTooWeak: ["border-red-500", "bg-red-500"],
  fullEvalBoxWeak: ["border-orange-400", "bg-orange-400"],
  fullEvalBoxMedium: ["border-yellow-300", "bg-yellow-300"],
  fullEvalBoxStrong: ["border-green-strong", "bg-green-strong"],
};

const STRENGTH_LABELS = {
  TOO_WEAK: "too weak!",
  WEAK: "weak",
  MEDIUM: "medium",
  STRONG: "strong",
};

// ============================================
// DOM Elements Cache
// ============================================
const elements = {
  passwordNum: document.getElementById("password-number"),
  optionError: document.getElementById("select-option-error"),
  copiedText: document.getElementById("copied"),
  copyImage: document.getElementById("copy-image"),
  lengthOutput: document.getElementById("length-output"),
  lengthInput: document.getElementById("length-input"),
  checkboxes: {
    all: document.querySelectorAll(".checkbox"),
    uppercase: document.getElementById("uppercase-checkbox"),
    lowercase: document.getElementById("lowercase-checkbox"),
    numbers: document.getElementById("numbers-checkbox"),
    symbols: document.getElementById("symbols-checkbox"),
  },
  strengthEvaluationText: document.getElementById("strength-evaluation"),
  evaluationBoxes: {
    all: document.querySelectorAll(".evaluation-box"),
    box1: document.getElementById("evaluation-box-1"),
    box2: document.getElementById("evaluation-box-2"),
    box3: document.getElementById("evaluation-box-3"),
    box4: document.getElementById("evaluation-box-4"),
  },
  generateButton: document.getElementById("generate-button"),
};

// ============================================
// State Management
// ============================================
const state = {
  currentPassword: "",
  copiedTimeoutId: null,
};

// ============================================
// Utility Functions
// ============================================

/**
 * Validates that all required DOM elements exist
 * @throws {Error} If any required element is missing
 */
const validateDOMElements = () => {
  const requiredElements = [
    "passwordNum",
    "lengthInput",
    "lengthOutput",
    "generateButton",
  ];

  requiredElements.forEach((key) => {
    if (!elements[key]) {
      throw new Error(`Required DOM element not found: ${key}`);
    }
  });
};

/**
 * Generates cryptographically secure random password
 * @param {number} length - Password length
 * @param {string} characterPool - Available characters
 * @returns {string} Generated password
 */
const generateSecurePassword = (length, characterPool) => {
  if (!characterPool || characterPool.length === 0) {
    throw new Error("Character pool cannot be empty");
  }

  const password = [];
  const poolLength = characterPool.length;

  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % poolLength;
    password.push(characterPool[randomIndex]);
  }

  return password.join("");
};

/**
 * Builds character pool based on selected checkboxes
 * @returns {string} Character pool
 */
const buildCharacterPool = () => {
  let pool = "";

  if (elements.checkboxes.uppercase.checked) {
    pool += CHARACTERS.uppercase;
  }
  if (elements.checkboxes.lowercase.checked) {
    pool += CHARACTERS.lowercase;
  }
  if (elements.checkboxes.numbers.checked) {
    pool += CHARACTERS.numbers;
  }
  if (elements.checkboxes.symbols.checked) {
    pool += CHARACTERS.symbols;
  }

  return pool;
};

/**
 * Determines password strength based on length
 * @param {number} length - Password length
 * @returns {string|null} Strength label or null if length is 0
 */
const getPasswordStrength = (length) => {
  if (length === 0) return null;

  const { TOO_WEAK, WEAK, MEDIUM, STRONG } = CONFIG.STRENGTH_THRESHOLDS;

  if (length >= TOO_WEAK.min && length <= TOO_WEAK.max)
    return STRENGTH_LABELS.TOO_WEAK;
  if (length >= WEAK.min && length <= WEAK.max) return STRENGTH_LABELS.WEAK;
  if (length >= MEDIUM.min && length <= MEDIUM.max)
    return STRENGTH_LABELS.MEDIUM;
  if (length >= STRONG.min && length <= STRONG.max)
    return STRENGTH_LABELS.STRONG;

  return null;
};

/**
 * Gets evaluation boxes to activate based on strength
 * @param {string} strength - Strength label
 * @returns {Array} Array of box elements to activate
 */
const getActiveBoxes = (strength) => {
  const { box1, box2, box3, box4 } = elements.evaluationBoxes;

  switch (strength) {
    case STRENGTH_LABELS.TOO_WEAK:
      return [box1];
    case STRENGTH_LABELS.WEAK:
      return [box1, box2];
    case STRENGTH_LABELS.MEDIUM:
      return [box1, box2, box3];
    case STRENGTH_LABELS.STRONG:
      return [box1, box2, box3, box4];
    default:
      return [];
  }
};

/**
 * Gets CSS classes for strength level
 * @param {string} strength - Strength label
 * @returns {Array} CSS classes
 */
const getStrengthClasses = (strength) => {
  switch (strength) {
    case STRENGTH_LABELS.TOO_WEAK:
      return CSS_CLASSES.fullEvalBoxTooWeak;
    case STRENGTH_LABELS.WEAK:
      return CSS_CLASSES.fullEvalBoxWeak;
    case STRENGTH_LABELS.MEDIUM:
      return CSS_CLASSES.fullEvalBoxMedium;
    case STRENGTH_LABELS.STRONG:
      return CSS_CLASSES.fullEvalBoxStrong;
    default:
      return [];
  }
};

// ============================================
// UI Update Functions
// ============================================

/**
 * Updates the range input track fill
 * @param {number} value - Current range value
 */
const updateRangeTrack = (value) => {
  const { MIN, MAX } = CONFIG.PASSWORD_LENGTH;
  const percentage = ((value - MIN) / (MAX - MIN)) * 100;

  elements.lengthInput.style.background = `linear-gradient(to right, #a4ffaf 0%, #a4ffaf ${percentage}%, #18171f ${percentage}%, #18171f 100%)`;

  elements.lengthOutput.textContent = value;
};

/**
 * Resets all evaluation boxes to empty state
 */
const resetEvaluationBoxes = () => {
  elements.evaluationBoxes.all.forEach((box) => {
    // Remove all strength classes
    box.classList.remove(
      ...CSS_CLASSES.fullEvalBoxTooWeak,
      ...CSS_CLASSES.fullEvalBoxWeak,
      ...CSS_CLASSES.fullEvalBoxMedium,
      ...CSS_CLASSES.fullEvalBoxStrong,
    );

    // Add empty classes
    box.classList.add(...CSS_CLASSES.emptyEvalBox);
  });
};

/**
 * Updates strength evaluation display
 * @param {number} length - Password length
 */
const updateStrengthEvaluation = (length) => {
  const strength = getPasswordStrength(length);

  // Reset boxes first
  resetEvaluationBoxes();

  if (!strength) {
    elements.strengthEvaluationText.textContent = "";
    return;
  }

  // Update text
  elements.strengthEvaluationText.textContent = strength;

  // Update boxes
  const activeBoxes = getActiveBoxes(strength);
  const strengthClasses = getStrengthClasses(strength);

  activeBoxes.forEach((box) => {
    box.classList.remove(...CSS_CLASSES.emptyEvalBox);
    box.classList.add(...strengthClasses);
  });
};

/**
 * Displays error message
 */
const showError = () => {
  elements.optionError.classList.remove(CSS_CLASSES.hidden);
  elements.passwordNum.classList.add(CSS_CLASSES.hidden);
};

/**
 * Hides error message
 */
const hideError = () => {
  elements.passwordNum.classList.remove(CSS_CLASSES.hidden);
  elements.optionError.classList.add(CSS_CLASSES.hidden);
};

/**
 * Shows "COPIED" message temporarily
 */
const showCopiedMessage = () => {
  // Clear existing timeout if any
  if (state.copiedTimeoutId) {
    clearTimeout(state.copiedTimeoutId);
  }

  elements.copiedText.classList.remove(CSS_CLASSES.hidden);

  // Auto-hide after configured duration
  state.copiedTimeoutId = setTimeout(() => {
    elements.copiedText.classList.add(CSS_CLASSES.hidden);
    state.copiedTimeoutId = null;
  }, CONFIG.COPIED_MESSAGE_DURATION);
};

/**
 * Resets all checkboxes
 */
const resetCheckboxes = () => {
  elements.checkboxes.all.forEach((checkbox) => {
    checkbox.checked = false;
  });
};

/**
 * Resets the entire UI to initial state
 */
const resetUI = () => {
  elements.passwordNum.textContent = "";
  elements.strengthEvaluationText.textContent = "";
  elements.lengthInput.value = CONFIG.PASSWORD_LENGTH.DEFAULT;
  elements.lengthOutput.textContent = CONFIG.PASSWORD_LENGTH.DEFAULT;
  elements.copiedText.classList.add(CSS_CLASSES.hidden);

  resetCheckboxes();
  resetEvaluationBoxes();
  hideError();
  updateRangeTrack(CONFIG.PASSWORD_LENGTH.DEFAULT);
};

// ============================================
// Core Functions
// ============================================

/**
 * Generates and displays password
 */
const generatePassword = () => {
  const length = parseInt(elements.lengthInput.value, 10);

  // Validate length
  if (isNaN(length) || length < CONFIG.PASSWORD_LENGTH.MIN) {
    resetUI();
    return;
  }

  // Handle zero length
  if (length === 0) {
    resetUI();
    return;
  }

  // Update strength evaluation
  updateStrengthEvaluation(length);

  // Build character pool
  const characterPool = buildCharacterPool();

  // Check if at least one checkbox is selected
  if (characterPool === "") {
    showError();
    resetEvaluationBoxes();
    elements.strengthEvaluationText.textContent = "";
    state.currentPassword = "";
    return;
  }

  // Generate password
  try {
    const password = generateSecurePassword(length, characterPool);
    state.currentPassword = password;

    // Display password
    hideError();
    elements.passwordNum.textContent = password;

    // Update ARIA attributes
    elements.generateButton.setAttribute("aria-pressed", "true");
  } catch (error) {
    console.error("Error generating password:", error);
    showError();
  }
};

/**
 * Copies password to clipboard
 */
const copyPasswordToClipboard = async () => {
  // Check if there's a password to copy
  if (!state.currentPassword) {
    return;
  }

  try {
    // Modern Clipboard API
    await navigator.clipboard.writeText(state.currentPassword);
    showCopiedMessage();
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = state.currentPassword;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showCopiedMessage();
    } catch (fallbackError) {
      console.error("Failed to copy password:", fallbackError);
      alert("Failed to copy password. Please try again.");
    }
  }
};

// ============================================
// Event Handlers
// ============================================

/**
 * Handles range input changes
 */
const handleRangeInput = (event) => {
  const value = parseInt(event.target.value, 10);
  if (!isNaN(value)) {
    updateRangeTrack(value);
  }
};

/**
 * Handles generate button click
 */
const handleGenerateClick = () => {
  generatePassword();
};

/**
 * Handles copy image click
 */
const handleCopyClick = () => {
  copyPasswordToClipboard();
};

/**
 * Handles keyboard events for accessibility
 */
const handleKeyboardCopy = (event) => {
  // Copy on Enter or Space when focused on copy button
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    copyPasswordToClipboard();
  }
};

// ============================================
// Event Listeners Setup
// ============================================
const setupEventListeners = () => {
  // Range input
  elements.lengthInput.addEventListener("input", handleRangeInput);

  // Generate button
  elements.generateButton.addEventListener("click", handleGenerateClick);

  // Copy functionality
  elements.copyImage.addEventListener("click", handleCopyClick);
  elements.copyImage.addEventListener("keydown", handleKeyboardCopy);

  // Make copy image focusable for keyboard navigation
  elements.copyImage.setAttribute("tabindex", "0");
  elements.copyImage.setAttribute("role", "button");
  elements.copyImage.setAttribute("aria-label", "Copy password to clipboard");
};

// ============================================
// App Initialization
// ============================================
const App = {
  init() {
    try {
      // Validate DOM elements
      validateDOMElements();

      //Configure range input from CONFIG
      elements.lengthInput.min = CONFIG.PASSWORD_LENGTH.MIN;
      elements.lengthInput.max = CONFIG.PASSWORD_LENGTH.MAX;
      elements.lengthInput.value = CONFIG.PASSWORD_LENGTH.DEFAULT;

      // Setup event listeners
      setupEventListeners();

      // Initialize UI
      resetUI();

      console.log("✅ Password Generator initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
      alert(
        "Failed to initialize the password generator. Please refresh the page.",
      );
    }
  },
};

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}
