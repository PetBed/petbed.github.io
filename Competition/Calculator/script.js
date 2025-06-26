const calculatorText = document.querySelector('#calculator input[type="text"]');
const conversionRate = 3;

function appendNumber(num) {
    if (calculatorText.value.includes(".") && num == ".") return;
    if (calculatorText.value.length > 3) return;
  calculatorText.value = "" + calculatorText.value + num;
  calculateAmount();
}

function deleteNumber() {
  calculatorText.value = calculatorText.value.slice(0, -1);
  calculateAmount();
}

function calculateAmount() {
  var amount = Number(calculatorText.value);

  if (isNaN(amount) || amount <= 0) {
    document.getElementById("calculator-children").innerHTML = 0;
    document.getElementById("calculator-time").innerHTML = 0;
    return;
  }

  var children = 0, time = 0;

  if (amount <= conversionRate * 7) {
    time = Math.floor(amount / conversionRate);
    children = 1;
  } else {
    children = Math.ceil(amount / (7 * conversionRate));
    time = Math.ceil(amount / (children * conversionRate));
  }

  var totalAmount = children * time * conversionRate;
  if (totalAmount > amount) {
    time = Math.floor(amount / (children * conversionRate));
  }

  document.getElementById("calculator-children").innerHTML = children;
  document.getElementById("calculator-time").innerHTML = time;
}