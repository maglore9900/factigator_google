const { DOMParser } = require('xmldom');
const { htmlToText } = require('html-to-text');
const fs = require('fs').promises;

async function fetchFromBackground(filename) {
    try {
        const data = await fs.readFile(filename, 'utf-8');
        return data;
    } catch (err) {
        console.error(`Error reading file from disk: ${err}`);
        return null;
    }
}

async function searchRSSFeed(url, searchTerm) {
    try {
        // Fetch the RSS feed
        const rssText = await fetchFromBackground("data_collection/test_file.txt");

        // Check if rssText is null or empty
        if (!rssText) {
            console.error(`Failed to fetch RSS feed from ${url}`);
            return [];
        }

        // Convert RSS content to plain text using htmlToText
        // const plainTextRSS = htmlToText(rssText, {
        //     wordwrap: 130,
        //     ignoreHref: true,
        //     ignoreImage: true,
        // });
        // console.log('Plain Text RSS:', plainTextRSS);
    
        // Parse the XML response using xmldom's DOMParser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, 'application/xml');

        // Check for parsing errors
        const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
        if (parseError) {
            console.error(`Error parsing RSS feed from ${url}`);
            return [];
        }

        // Fetch all <item> elements
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

            // Convert title to plain text (if necessary)
            const plainTitle = htmlToText(titleText, {
                wordwrap: 130,
                ignoreHref: true,
                ignoreImage: true,
            });

            console.log('RSS Title:', plainTitle);

            // Ensure titleText is a string before calling toLowerCase()
            return typeof plainTitle === 'string' && plainTitle.toLowerCase().includes(searchTerm.toLowerCase());
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

// Test the function
(async () => {
    const url = 'test';
    const searchTerm = 'harris';
    const results = await searchRSSFeed(url, searchTerm);
    console.log('Search Results:', results);
})();
