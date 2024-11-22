

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factCheck",
    title: "Fact Check",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck" && info.selectionText) {
    // Inject the correct bundled file
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['dist/content.bundle.js']  // Use content.bundle.js instead of content.js
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Script injection failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Script injected successfully.");
          sendMessageToContentScript(tab.id, info.selectionText);
        }
      }
    );
  }
});

function sendMessageToContentScript(tabId, selectedText) {
  chrome.storage.local.set({ query: selectedText });

  // Send message to the content script
  chrome.tabs.sendMessage(tabId, { action: "factCheck", query: selectedText }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Message sending failed:", chrome.runtime.lastError.message);
    } else {
      console.log("Received response:", response);
    }
  });
}

//Validate API keys


//Fetch Data  
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "fetchFactCheckData") {
//     (async () => {
//       try {
//         const response = await fetch(request.url, {
//           method: 'GET', // You can specify the method explicitly if needed
//           headers: {
//             'User-Agent': 'Mozilla/5.0', // Set your custom User-Agent here
//             'Accept':  'application/json, text/plain, */*', // Add other custom headers if necessary, e.g., 'Accept': 'application/json'
//           },
//         });

//         if (!response.ok) {
//           throw new Error(`Network response was not ok: ${response.statusText}`);
//         }

//         // Parse the response as JSON or text (depending on what is expected)
//         const data = await response.text(); // Or use response.text() if needed
//         sendResponse({ success: true, data }); // Send parsed data
//       } catch (error) {
//         sendResponse({ success: false, error: error.message });
//       }
//     })();

//     return true; // Keeps the message channel open for asynchronous response
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchFactCheckData") {
    (async () => {
      try {
        const response = await fetch(request.url, {
          method: 'GET', // You can specify the method explicitly if needed
          headers: {
            'User-Agent': 'Mozilla/5.0', // Set your custom User-Agent here
            'Accept': 'application/json, text/plain, */*', // Add other custom headers if necessary, e.g., 'Accept': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Parse the response as JSON or text (depending on what is expected)
        const data = await response.text(); // Or use response.text() if needed
        sendResponse({ success: true, data }); // Send parsed data
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keeps the message channel open for asynchronous response
  } else if (request.action === "checkEndPoint") {
    (async ({ llmType, apiKey = '', endPoint = '', model = '' } = {}) => {
      let response;
      try {
        if (llmType === "openai") {
          response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`, // Using Bearer token for authentication
            }
          });
        } else if (llmType === "ollama") {
          response = await fetch(`${endPoint}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              "model": model,
              "prompt": "Hello", // Ensure to match PowerShell prompt if testing equivalence
              "stream": false
            })
          });
        } else if (llmType === "google") {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({"contents":[{"parts":[{"text":"Explain how AI works"}]}]})
          });
        }

        if (response.ok) { // Checks for 200-299 status codes
          sendResponse({ success: true, message: 'API key/Endpoint Validated! Make sure to save.' });
        } else {
          const errorData = await response.json();
          sendResponse({
            success: false,
            status: response.status,
            errorDetails: errorData,
            message: `API key validation failed. Status: ${response.status}`
          });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })(request);

    return true; // Keeps the message channel open for asynchronous response
  }
});

  