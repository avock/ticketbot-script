  // main method 2 : evaluates all elements using ::evaluateElementStatus
  async function evaluateElement() {
    const elementStatuses = await Promise.all(
      openTabs.map((tab, index) => evaluateElementStatus(tab, index))
    );

    // optimal solution: only adds elements that have changed to table + only print when such element present
    elementStatuses.forEach((status, index) => {
      if (status.status) {
        tabSuccessful = true
        const { title } = openTabs[index];
        addToTable(title, status.status, status.text);
        // telegram.sendMessage(groupChatID, 'HELLO THERES A SUCCESSFUL QUEUE COME CHECK')
      }
    });
    if (tabSuccessful) console.log(table.toString());

    // // sub-optimal solution, prints everything during every scan
    // clearTable()
    // elementStatuses.forEach((status, index) => {
    //   const { title } = openTabs[index];
    //   addToTable(title, status.status, status.text);
    // });
    // console.log(table.toString());
  }
  
  async function evaluateElementStatus(tab, tabIndex) {
    try {
      const page = tab.page;
      const timeout = 1000; 

      // produces an error if element doesn't exist
      const element = await page.waitForSelector(targetElement, { timeout });
      // obtains text within targetElement
      const elementText = await page.evaluate((el) => el.innerText, element);
      // checks if text in element is changed
      const status = (elementText === previousTexts[tabIndex])
        ? false 
        : (previousTexts[tabIndex] === '' || previousTexts[tabIndex] === undefined)
            ? false 
            : true
      previousTexts[tabIndex] = elementText;

      return { status, text: elementText };

    } catch (error) {
        return { status: 'Error', text: 'Error evaluating element status' };
    }
  }

  function createTable() {
    return new Table({
      head: ['Tab Title', 'Changed?', 'Element Text'],
      colWidths: [20, 20, 40],
    });
  }

  function clearTable() {
    table.splice(0);
  }

  function addToTable(title, status, text) {
    const row = [title, status, text];
    table.push(row);
  }