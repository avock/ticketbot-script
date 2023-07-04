fetch('https://example.com/api/data')
  .then(response => {
    // Access the response data here
    console.log(response);
    return response.json(); // Parse the response as JSON
  })
  .then(data => {
    // Use the parsed response data here
    console.log(data);
  })
  .catch(error => {
    // Handle any errors that occur during the request
    console.error(error);
  });