$(document).ready(function () {
  const apiKey = '1ea84e15d021bc2828e336684394b31a4211039c9af5e8b6e7026d86a8474197'; // Replace with your API key
  const apiUrl = 'https://api.changenow.io/v1';
  let currenciesData = [];
  let currentMinAmount = null;

  // Function to display an error message
  function displayError(message) {
      const errorMessage = document.getElementById('errorMessage');
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
  }

  // Function to hide the error message
  function hideError() {
      const errorMessage = document.getElementById('errorMessage');
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
  }

  // Fetch the minimum amount for the selected currency pair
  async function checkMinimumAmount(fromCurrency, toCurrency) {
      const pair = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
      try {
          const response = await fetch(`${apiUrl}/min-amount/${pair}?api_key=${apiKey}`);
          const data = await response.json();
          currentMinAmount = data.minAmount;
          return currentMinAmount;
      } catch (error) {
          console.error('Error fetching minimum amount:', error);
          displayError('Failed to fetch the minimum amount. Please try again.');
          return null;
      }
  }

  // Fetch the estimated amount
  async function getEstimatedAmount(fromCurrency, toCurrency, fromAmount) {
      const pair = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
      try {
          const response = await fetch(`${apiUrl}/exchange-amount/${fromAmount}/${pair}?api_key=${apiKey}`);
          const data = await response.json();
          return data.estimatedAmount;
      } catch (error) {
          console.error('Error fetching estimated amount:', error);
          displayError('Failed to fetch the estimated amount. Please try again.');
          return null;
      }
  }

  async function updateUI() {
    hideError();

    // Select elements using unique IDs
    const fromAmountInput = document.querySelector('#fromCurrencyGroup input.val');
    const toAmountInput = document.querySelector('#toCurrencyGroup input.val');
    const fromDropdownSpan = document.querySelector('#fromCurrencyGroup .dropdown-selected span');
    const toDropdownSpan = document.querySelector('#toCurrencyGroup .dropdown-selected span');

    // Debugging elements to verify they are found
    console.log('From Dropdown Span:', fromDropdownSpan);
    console.log('To Dropdown Span:', toDropdownSpan);

    if (!fromDropdownSpan || !toDropdownSpan) {
        displayError('Please select both currencies.');
        return;
    }

    const fromCurrency = fromDropdownSpan.textContent.trim();
    const toCurrency = toDropdownSpan.textContent.trim();

    // Debug selected currencies
    console.log('From Currency:', fromCurrency);
    console.log('To Currency:', toCurrency);

    // Validate dropdown selections
    if (!fromCurrency || !toCurrency) {
        displayError('Please select both currencies.');
        return;
    }

    const fromAmount = parseFloat(fromAmountInput?.value);

    // Validate input amount
    if (!fromAmount || fromAmount <= 0) {
        displayError('Please enter a valid amount.');
        return;
    }

    // Check the minimum amount
    const minAmount = await checkMinimumAmount(fromCurrency, toCurrency);
    console.log('Minimum Amount:', minAmount);
    if (minAmount === null) return; // Stop if fetching minimum amount fails

    if (fromAmount < minAmount) {
        displayError(`Minimum amount required is ${minAmount} ${fromCurrency}.`);
        return;
    }

    // Fetch and display the estimated amount
    const estimatedAmount = await getEstimatedAmount(fromCurrency, toCurrency, fromAmount);
    console.log('Estimated Amount:', estimatedAmount);
    if (estimatedAmount === null) return; // Stop if fetching estimated amount fails

    toAmountInput.value = estimatedAmount.toFixed(6); // Show up to 6 decimal places
    hideError();
}



  // Fetch available currencies and populate the dropdowns
  function fetchCurrencies() {
      console.log('Fetching available currencies...');
      axios.get(`${apiUrl}/currencies?active=true&fixedRate=true`)
          .then(response => {
              currenciesData = response.data;
              console.log('Currencies fetched successfully:', currenciesData);
              populateDropdowns();
          })
          .catch(error => {
              console.error('Error fetching currencies:', error);
              displayError('Failed to fetch available currencies. Please try again.');
          });
  }

  // Populate the dropdowns with currencies
  function populateDropdowns() {
      const dropdowns = document.querySelectorAll('.custom-dropdown');
      console.log('Dropdown elements found:', dropdowns);

      dropdowns.forEach(dropdown => {
          const dropdownOptions = dropdown.querySelector('.dropdown-options');
          console.log('Populating dropdown:', dropdown);

          dropdownOptions.innerHTML = ''; // Clear existing options

          currenciesData.forEach(currency => {
              const li = document.createElement('li');
              li.setAttribute('data-value', currency.ticker.toUpperCase());
              li.setAttribute('data-name', currency.name);
              li.setAttribute('data-image', currency.image);

              li.onclick = function () {
                  selectOption(this);
              };

              li.innerHTML = `
                  <img src="${currency.image}" alt="${currency.ticker} Logo" class="option-icon" />
                  ${currency.ticker.toUpperCase()}
              `;
              dropdownOptions.appendChild(li);
          });

          console.log('Finished populating dropdown:', dropdown);
      });

      console.log('All dropdowns have been populated.');
  }

  // Toggle dropdown visibility
  window.toggleDropdown = function (element) {
      closeAllDropdowns();
      const customDropdown = element.closest('.custom-dropdown');
      customDropdown.classList.toggle('open');
  };

  // Close all dropdowns
  function closeAllDropdowns() {
      const dropdowns = document.querySelectorAll('.custom-dropdown');
      dropdowns.forEach(dropdown => {
          dropdown.classList.remove('open');
      });
  }

  window.selectOption = function (element) {
    const customDropdown = element.closest('.custom-dropdown');
    const selected = customDropdown.querySelector('.dropdown-selected');
    const img = selected.querySelector('.dropdown-icon');
    const span = selected.querySelector('span');

    const newImgSrc = element.getAttribute('data-image');
    const newTicker = element.getAttribute('data-value');

    img.src = newImgSrc;
    span.textContent = newTicker;

    // Close the dropdown
    closeAllDropdowns();

    // Trigger UI update
    updateUI();
};


  // Close dropdowns when clicking outside
  window.addEventListener('click', function (e) {
      if (!e.target.matches('.dropdown-selected') && !e.target.matches('.dropdown-selected *')) {
          closeAllDropdowns();
      }
  });

  // Event listeners for input and dropdowns
  document.querySelector('.input-group:nth-child(1) input.val').addEventListener('input', updateUI);
  document.querySelectorAll('.custom-dropdown .dropdown-selected').forEach(dropdown => {
  dropdown.addEventListener('click', updateUI);
  });

  // Fetch currencies on page load
  fetchCurrencies();
  async function initiateTransaction() {
    hideError();

    const fromCurrency = document.querySelector('#fromCurrencyGroup .dropdown-selected span').textContent.trim();
    const toCurrency = document.querySelector('#toCurrencyGroup .dropdown-selected span').textContent.trim();
    const fromAmount = parseFloat(document.querySelector('#fromCurrencyGroup input.val').value);
    const receivingWallet = document.querySelector('.input-group .input-text').value.trim();

    if (!receivingWallet) {
        displayError('Please enter a valid receiving wallet address.');
        return;
    }

    if (!fromAmount || fromAmount <= 0) {
        displayError('Please enter a valid amount.');
        return;
    }

    console.log(`Initiating transaction: ${fromCurrency} -> ${toCurrency}, Amount: ${fromAmount}, Wallet: ${receivingWallet}`);

    try {
        const response = await fetch(`${apiUrl}/transactions/${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromCurrency,
                to: toCurrency,
                amount: fromAmount,
                address: receivingWallet,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            displayError(errorData.message || 'Failed to create transaction. Please try again.');
            return;
        }

        const transaction = await response.json();
        transactionId = transaction.id; // Store transaction ID for polling
        document.getElementById('depositAddress').textContent = transaction.payinAddress;
        document.getElementById('transactionStatus').textContent = "Waiting for deposit...";
        pollTransactionStatus(); // Start polling transaction status
    } catch (error) {
        console.error('Error creating transaction:', error);
        displayError('An unexpected error occurred. Please try again.');
    }
}

// Function to poll transaction status
function pollTransactionStatus() {
  console.log(`Polling transaction status for ID: ${transactionId}`);
  const statusInterval = setInterval(async () => {
      if (!transactionId) {
          clearInterval(statusInterval);
          return;
      }

      try {
          // Use the updated API endpoint format
          const response = await fetch(`${apiUrl}/transactions/${transactionId}/${apiKey}`);
          if (!response.ok) {
              throw new Error('Failed to fetch transaction status');
          }

          const transaction = await response.json();
          const status = transaction.status;

          console.log(`Transaction status: ${status}`);
          document.getElementById('transactionStatus').textContent = `Status: ${status}`;

          // Stop polling when transaction is complete or fails
          if (['finished', 'failed', 'expired'].includes(status)) {
              clearInterval(statusInterval);
              transactionId = null; // Reset transaction ID
          }
      } catch (error) {
          console.error('Error checking transaction status:', error);
          clearInterval(statusInterval);
          displayError('Error checking transaction status. Please try again.');
      }
  }, 5000); // Poll every 5 seconds
}


// Attach event listener to the Swap button
document.querySelector('.submit-btn').addEventListener('click', function (event) {
    event.preventDefault();
    initiateTransaction();
});
});
