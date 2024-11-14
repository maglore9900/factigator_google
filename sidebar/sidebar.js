let intervalId

// Function to create the sidebar structure
function createSidebarElements() {
  const sidebar = document.getElementById('sidebar-content');

  if (!sidebar) {
    console.error('Sidebar container not found!');
    return;
  }

  // Claim element
  const claimElement = document.createElement('div');
  claimElement.id = 'claim-text';
  claimElement.innerHTML = '<strong>Claim:</strong> Loading...';
  sidebar.appendChild(claimElement);

  // Summary element
  const summaryElement = document.createElement('div');
  summaryElement.id = 'summary-text';
  summaryElement.innerHTML = '<strong>Summary:</strong> Pending...';
  // summaryElement.innerHTML = '<strong>Summary:</strong> <span id="summary-progress">Pending...</span>';
  sidebar.appendChild(summaryElement);
  startProgressIndicator('summary-text')
  

  // Status element
  const statusElement = document.createElement('div');
  statusElement.id = 'status-text';
  statusElement.innerHTML = '<strong>Status:</strong> Loading...';
  sidebar.appendChild(statusElement);

  // Sources element
  const sourcesElement = document.createElement('div');
  sourcesElement.id = 'sources-text';
  sourcesElement.innerHTML = '<strong>Data Points:</strong> Pending sources...';
  sidebar.appendChild(sourcesElement);
}

// Function to update the sidebar elements dynamically
function updateSidebarContent(data) {
  // Select sidebar elements
  
  const claimElement = document.getElementById('claim-text');
  const summaryElement = document.getElementById('summary-text');
  const statusElement = document.getElementById('status-text');
  const sourcesElement = document.getElementById('sources-text');

  // Update claim
  if (claimElement) {
    claimElement.innerHTML = `<strong>Claim:</strong> ${data.claim || 'No claim provided.'}`;
  } else {
    console.error('Claim element not found.');
  }

  // Update summary if available
  if (data.summary) {
    onSummaryReady()
    const formattedSummary = data.summary.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    if (typeof marked !== 'undefined') {
      summaryElement.innerHTML = `<strong>Summary:</strong><br>${marked.parse(formattedSummary)}`;
    } else {
      summaryElement.innerHTML = `<strong>Summary:</strong><br>${formattedSummary}`;
    }
  }

  // Update status
  if (statusElement) {
    statusElement.innerHTML = `<strong>Status:</strong> ${data.status || 'No status available.'}`;
  } else {
    console.error('Status element not found.');
  }

  // Update sources if available
  if (sourcesElement) {
    const sourcesList = data.sources && data.sources.length > 0
      ? data.sources.map(src => {
          const sourceName = src['Source Name'] || 'Unknown Source';
          const sourceUrl = src['Source URL'] || '#';
          const claim = src['Claim'] || 'No claim provided';
          return `<li><strong>Claim:</strong> ${claim}<br><strong>Source:</strong> <a href="${sourceUrl}" target="_blank">${sourceName}</a></li>`;
        }).join('')
      : 'No sources available.';
    sourcesElement.innerHTML = `<strong>Data Points:</strong><ul>${sourcesList}</ul>`;
  } else {
    console.error('Sources element not found.');
  }
}

// Listen for messages from index.js
window.addEventListener('message', (event) => {
  if (event.data.action === 'displaySummary') {
    // console.log("Received data in sidebar:", event.data.data);  // Log the received data
    updateSidebarContent(event.data.data);
  }
});

// Initialize the sidebar once the page loads
document.addEventListener('DOMContentLoaded', () => {
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'sidebar-content';
  sidebarContainer.style.cssText = `
    padding: 10px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  document.body.appendChild(sidebarContainer);

  // Create the sidebar elements
  createSidebarElements();
});

function startProgressIndicator(elementId) {
  let dotCount = 0;
  const maxDots = 3; // Maximum number of dots

  // Find the element where the progress indicator should be displayed
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID '${elementId}' not found.`);
    return;
  }
  
  // Start the interval to update the dots
  intervalId = setInterval(() => {
    dotCount = (dotCount + 1) % (maxDots + 1); // Cycle between 0 and maxDots
    element.innerHTML = `<strong>Summary:</strong> Pending${'.'.repeat(dotCount)}`;
  }, 500); // Update every 500ms

  // Return the interval ID for future clearing if needed
  return intervalId;
}

function onSummaryReady() {
  // Clear the interval to stop the dot animation
  clearInterval(intervalId);
}

