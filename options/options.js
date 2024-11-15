let browser = (typeof chrome !== 'undefined') ? chrome : (typeof browser !== 'undefined') ? browser : null;


document.addEventListener("DOMContentLoaded", () => {
    initializeOptions()
    restoreOptions();  // Restore options when the page loads
    setupEventHandlers();  // Set up event handlers for inputs and buttons

    // Set up event listeners for the new buttons
    document.getElementById("restore-button").addEventListener("click", () => {
        if (confirm("Are you sure you want to restore the default options? This will overwrite your current settings.")) {
            restoreOptions();  // Call the existing restoreOptions function
        }
    });

    document.getElementById("save-button").addEventListener("click", saveOptions);  // Call the existing saveOptions function
});


function setupEventHandlers() {
    document.getElementById("llm-type").addEventListener("change", (e) => {
        toggleLLMFields(e.target.value);
        // saveOptions(); // Save whenever LLM type changes
    });

    // document.getElementById("settings-form").addEventListener("submit", saveOptions);

    // Add a change event listener for all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", saveOptions); // Save when checkboxes change
    });

    document.getElementById("add-rss-feed").addEventListener("click", () => addEntry('rss-feed-list', 'RSS Feed'));

    // Add event to unmask OpenAI API key for editing
    const openaiApiKeyInput = document.getElementById("openai-api-key");
    openaiApiKeyInput.addEventListener("focus", () => unmaskApiKey(openaiApiKeyInput));
    const googleApiKeyInput = document.getElementById("google-api-key");
    googleApiKeyInput.addEventListener("focus", () => unmaskApiKey(googleApiKeyInput));
}

function toggleLLMFields(llmType) {
    const openaiKeyGroup = document.getElementById("openai-key-group");
    const googleKeyGroup = document.getElementById("google-key-group");
    const openaiModelGroup = document.getElementById("openai-model-group");
    const ollamaFields = document.getElementById("ollama-fields");

    if (llmType === "ollama") {
        openaiKeyGroup.style.display = "none";
        openaiModelGroup.style.display = "none";
        ollamaFields.style.display = "block";
        googleKeyGroup.style.display = "none"
    } else if (llmType == "google") {
        openaiKeyGroup.style.display = "none";
        openaiModelGroup.style.display = "none";
        ollamaFields.style.display = "none";
        googleKeyGroup.style.display = "Block"
    
    } else {
        openaiKeyGroup.style.display = "block";
        openaiModelGroup.style.display = "block";
        ollamaFields.style.display = "none";
        googleKeyGroup.style.display = "none"
    }
}

function addEntry(listId, placeholder) {
    const list = document.getElementById(listId);
    const entryDiv = document.createElement('div');
    entryDiv.className = 'input-group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    entryDiv.appendChild(checkbox);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dynamic-input';
    input.placeholder = `Enter ${placeholder}`;
    entryDiv.appendChild(input);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn delete-btn';
    deleteBtn.addEventListener('click', () => list.removeChild(entryDiv));
    entryDiv.appendChild(deleteBtn);

    list.appendChild(entryDiv);
}

function getEnabledItems(listId) {
  const enabledItems = [];
  document.querySelectorAll(`#${listId} .input-group`).forEach(div => {
      const input = div.querySelector('input[type="text"]');
      const checkbox = div.querySelector('input[type="checkbox"]');

      if (checkbox.checked) {
          enabledItems.push(input.value); // Add the value only if the checkbox is checked
      }
  });
  return enabledItems;
}

function saveOptions(e) {
    if (e) e.preventDefault(); // Prevent form submission default behavior

    const llmType = document.getElementById("llm-type").value;
    let openaiApiKey = document.getElementById("openai-api-key").value || '';
    let googleApiKey = document.getElementById("google-api-key").value || '';
    const openaiModel = document.getElementById("openai-model").value;
    const ollamaEndpoint = document.getElementById("ollama-endpoint").value;
    const ollamaModel = document.getElementById("ollama-model").value;
    const googleFactCheckerEnabled = document.getElementById("google-fact-checker").checked;
    // console.log(`googleFactCheckerEnabled: ${googleFactCheckerEnabled}`); // Log the value of googleFactCheckerEnabled

    // Gather all RSS feeds, both enabled and disabled
    const rssFeeds = [];
    document.querySelectorAll('#rss-feed-list .input-group').forEach(div => {
        const input = div.querySelector('input[type="text"]');
        const checkbox = div.querySelector('input[type="checkbox"]');
        rssFeeds.push({ url: input.value, enabled: checkbox.checked });
    });


    // Only save the API key if it is not masked (to prevent saving masked value)
    if (openaiApiKey === "********") {
        openaiApiKey = null; // Don't overwrite the saved key with masked value
    }
    if (googleApiKey === "********") {
        googleApiKey = null; // Don't overwrite the saved key with masked value
    }

    // Save the options to local storage
    browser.storage.local.set({
        llmType,
        openaiApiKey,
        openaiModel,
        ollamaEndpoint,
        ollamaModel,
        googleFactCheckerEnabled,
        rssFeeds,  // Save the entire list of RSS feeds
        googleApiKey,
    }, () => {
        const status = document.getElementById("status");
        status.textContent = "Options saved successfully!";
        setTimeout(() => { status.textContent = ""; }, 2000);

        // Mask the OpenAI API key after saving
        if (openaiApiKey) {
            maskApiKey();
        }
    });
}



function maskApiKey() {
    const apiKeyInput = document.getElementById("openai-api-key");
    apiKeyInput.type = "password";
    apiKeyInput.value = "********";
    apiKeyInput.setAttribute("readonly", true);
}

function unmaskApiKey(inputElement) {
    if (inputElement.value === "********") {
        inputElement.type = "text";
        inputElement.value = ""; // Clear the field for user input
        inputElement.removeAttribute("readonly");
    }
}

function restoreOptions() {
    browser.storage.local.get({
        llmType: "openai",
        openaiApiKey: "",
        openaiModel: "gpt-4o-mini",
        ollamaEndpoint: "http://localhost:11434",
        ollamaModel: "llama3.2:3b",
        googleFactCheckerEnabled: true,
        rssFeeds: [],
    }, (result) => {
        // Set LLM type and model fields
        document.getElementById("llm-type").value = result.llmType;
        document.getElementById("openai-model").value = result.openaiModel;
        document.getElementById("ollama-endpoint").value = result.ollamaEndpoint;
        document.getElementById("ollama-model").value = result.ollamaModel;

        // Restore OpenAI API key
        if (result.openaiApiKey) {
            document.getElementById("openai-api-key").value = "********";
            maskApiKey();
        }

        document.getElementById("google-fact-checker").checked = result.googleFactCheckerEnabled;

        // Use default RSS feeds if none are saved
        const rssFeeds = result.rssFeeds.length > 0 ? result.rssFeeds : [
            { url: 'https://www.factcheck.org/feed/', enabled: true },
            { url: 'https://www.politifact.com/rss/factchecks/', enabled: true }
        ];


        // Display RSS feeds
        const rssFeedList = document.getElementById('rss-feed-list');
        rssFeedList.innerHTML = '';  // Clear the list
        rssFeeds.forEach(feed => {
            addExistingEntry(rssFeedList, feed.url, feed.enabled);
        });

    });
}

// Helper function to add an entry to the list
function addExistingEntry(list, value, enabled) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'input-group';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    entryDiv.appendChild(checkbox);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = 'dynamic-input';
    entryDiv.appendChild(input);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn delete-btn';
    deleteBtn.addEventListener('click', () => list.removeChild(entryDiv));
    entryDiv.appendChild(deleteBtn);

    list.appendChild(entryDiv);
}

function initializeOptions() {
    // Define default RSS feeds and URLs
    const defaultRssFeeds = [
        { url: 'https://www.factcheck.org/feed/', enabled: true },
        { url: 'https://www.politifact.com/rss/factchecks/', enabled: true }
    ];


    // Display defaults initially
    const rssFeedList = document.getElementById('rss-feed-list');
    defaultRssFeeds.forEach(feed => addExistingEntry(rssFeedList, feed.url, feed.enabled));


    // Retrieve saved settings from local storage
    browser.storage.local.get(['rssFeeds', 'urls'], (result) => {
        console.log('Retrieved settings from storage:', result);  // Log retrieved settings

        // If saved RSS feeds exist, override defaults
        if (result.rssFeeds && result.rssFeeds.length > 0) {
            rssFeedList.innerHTML = '';  // Clear the list
            result.rssFeeds.forEach(feed => addExistingEntry(rssFeedList, feed.url, feed.enabled));
        }

    });
}
