const options = {method: 'GET'};

fetch('https://api-evm.orderly.org/v1/get_account?address=0x5A37f35c2209E72C54196aB2E650b794e2753081&broker_id=vls', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));