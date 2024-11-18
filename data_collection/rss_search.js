import { DOMParser } from 'xmldom';
import fetch from 'node-fetch';
import { htmlToText } from 'html-to-text';

class RSSreader {
  constructor(settings) {
    this.settings = settings;
    this.results = {}; // Store the final JSON results here
    this.rssUrls = []; // Store the RSS feed URLs
    this.rawRSSUrls = this.settings.rssFeeds; // Store the raw RSS feed URLs
    this.getContent = 0; // Counter for fetched content

    this.initFunction(); // Call the initialization function
  }

  initFunction() {
    this.getDomain(this.rawRSSUrls); // Call getDomain with provided URLs
  }
  
  async getDomain(urls) {
    for (const { enabled, url } of urls) {
      if (enabled) {
        // Extract the domain from the URL
        const parts = url.split('.');
        const domain = `${parts[1]}.${parts[2]}`; // Get the second and third parts
        
        // Push the URL and domain to rssUrls
        this.rssUrls.push({ url: url, domain: domain });
      }
    }
    // console.log(`Rss URLs: ${JSON.stringify(this.rssUrls)}`);
  }

  async fetchRSSData(url) {
    const baseUrl = encodeURIComponent(url); // Ensure URL is encoded
    try {
      // Fetch the RSS feed through the proxy
      const response = await fetch(`https://api.allorigins.win/get?url=${baseUrl}`);
      
      // Check if the response is ok
      if (!response.ok) {
        console.error("Failed to fetch RSS feed:", response.statusText);
        return null;
      }
  
      // Parse the JSON response from AllOrigins
      const data = await response.json();
      if (typeof data.contents !== 'string') {
        console.error("Unexpected response type for contents:", data.contents);
        return null;
      }
  
      // Extract the contents from the 'contents' property
      if (data.contents) {
        return data.contents; // Return the RSS content as text
      } else {
        console.error("No contents found in response");
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch or parse RSS feed:", error);
      return null;
    }
  }
  
  async searchRSSFeed(url, searchTerm) {
    try {
        // Fetch the RSS feed
        let rssText = null;
        searchTerm = String(searchTerm);

        if (this.getContent < this.rssUrls.length) {
            rssText = await this.fetchFromBackground(url);
            this.getContent += 1;
        }

        // Check if rssText is null or empty
        if (!rssText) {
            console.error(`Failed to fetch RSS feed from ${url}`);
            return [];
        }

        if (typeof rssText !== 'string') {
            console.error('rssText is not a string:', rssText);
            return [];
        }
        // Handle Base64 encoding if necessary
        if (rssText.startsWith('data:application/rss+xml; charset=UTF-8;base64,')) {
            const base64Data = rssText.split(',')[1]; // Get the Base64 content after the comma
            rssText = Buffer.from(base64Data, 'base64').toString('utf-8');
        }

        // Parse the XML response using DOMParser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, 'application/xml');
        console.log('Parsed XML Document:', xmlDoc);


        // Check for parsing errors
        const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
        if (parseError) {
            console.error(`Error parsing RSS feed from ${url}`);
            return [];
        }

        // Fetch all <title> elements
        const items = xmlDoc.getElementsByTagName('item');

        console.log(`Found ${items.length} <item> elements in the RSS feed.`);

        if (items.length === 0) {
            console.warn('No <item> elements found in the RSS feed.');
            return [];
        }

        // Process <item> elements to find matches
        const searchResults = Array.from(items).filter(item => {
            const titleNode = item.getElementsByTagName('title')[0];
            const titleText = titleNode?.textContent || ''; // Default to an empty string if no title
            console.log('RSS Title:', titleText);

            // Ensure titleText is a string before calling toLowerCase()
            return typeof titleText === 'string' && titleText.toLowerCase().includes(searchTerm.toLowerCase());
        }).map(item => {
            const title = item.getElementsByTagName('title')[0]?.textContent || 'No title';
            const link = item.getElementsByTagName('link')[0]?.textContent || 'No link';
            return { title, link };
        });

        console.log(`Found ${searchResults.length} matching titles.`);
        return searchResults;
    } catch (error) {
        console.error(`Error fetching or parsing RSS feed from ${url}:`, error);
        return [];
    }
}

  

  // Method to get content from a URL and convert it to plain text
  async getUrlContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const htmlContent = await response.text();
      const plainText = htmlToText(htmlContent, {
        wordwrap: 130,
        ignoreHref: true,
        ignoreImage: true
      });

      return plainText;
    } catch (error) {
      // console.error(`Error fetching or parsing URL content from ${url}:`, error);
      return '';
    }
  }

  async searchMultipleFeeds(searchTerm) {
    let foundResults = false; // To check if any results are found
  
    // Create an array of promises for concurrent feed searches
    const feedPromises = this.rssUrls.map(async ({ url, domain }) => {
      console.log(`\nSearching RSS feed at: ${url} (${domain} with search term: ${searchTerm})`);
    
      // Search the RSS feed for the given term
      const searchResults = await this.searchRSSFeed(url, searchTerm);
        
    
      if (searchResults.length > 0) {
        foundResults = true; // Mark that results are found
        console.log(`Found RSS results in ${url}:`, searchResults);

        // Initialize the result array for the identifier if it doesn't exist
        if (!this.results[domain]) {
          this.results[domain] = [];
          }

          // Append search results to the results array for the identifier
          this.results[domain].push(...searchResults);
        } else {
          console.log(`No results found for "${searchTerm}"`);
        }
      });
  
    // Run all feed searches concurrently
    await Promise.all(feedPromises);
    console.log('Final results:', this.results); // Log final results before returning

  
    // Return the results or an empty object
    return foundResults ? this.results : {};
  }
  
  

  // Get the results as JSON
  getResultsAsJson() {
    return JSON.stringify(this.results, null, 2); // Pretty-print JSON
    // return {
    //   json: JSON.stringify(this.results, null, 2), // Pretty-printed JSON string
    //   domains: Object.keys(this.results) // List of the domains
    // };
  }


  fetchFromBackground(url) {
    // console.log(`Fetching from background: ${url}`);
    return new Promise((resolve, reject) => {
      // Send message to the background script with the URL
      chrome.runtime.sendMessage(
        { action: "fetchFactCheckData", url: url },
        response => {
          if (chrome.runtime.lastError) {
            console.error(`Runtime error: ${chrome.runtime.lastError.message}`);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.success) {
            // Return the raw JSON data
            // console.log('Response data:', response.data);
            resolve(response.data);
          } else if (!response) {
            console.log('No response from background script');
            resolve(null); // Resolve with null or another suitable value
          } else {
            const errorMessage = response.error || 'Unknown error occurred';
            console.error(`Fetch failed: ${errorMessage}`);
            reject(new Error(errorMessage));
            return;
          }
        }
      );
    });
  }
}
export default RSSreader;


// (async () => {
//   const settings = {
//     rssFeeds: [{"enabled":true,"url":"https://www.factcheck.org/feed/"},{"enabled":true,"url":"https://www.politifact.com/rss/factchecks/"}]
//   };

//   let rssReader = new RSSreader(settings);
//   let results = await rssReader.searchMultipleFeeds('kamala');
//   console.log(results); // Output the results as JSON
// })();