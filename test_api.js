async function validateApiKey({ llmType, apiKey = '', endPoint = '', model = '' } = {}) {
    let response;
    try {
        if(llmType === "openai"){
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
                    "prompt": "Why is the sky blue?", // Ensure to match PowerShell prompt if testing equivalence
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
            console.log('API key is valid!');
        } else {
            console.log(`API key validation failed. Status: ${response.status}`);
            const errorData = await response.json();
            console.log('Error Details:', errorData);
        } 
    } catch (error) {
        console.error('Error connecting to the API:', error.message);
    }
}

// Usage
// validateApiKey('https://api.openai.com/v1/models', 'sk-svcacct-inUrKaMRY64p960c4M7B6RtXO4DK4bkL9iVuaUn5GKhtluqKLixWZ8gdCxBcBtNsT3BlbkFJSvit3haV0iqZB-hN0fVzVYUSxsfqb4PTmYxR_0jzqMLMyG9OfusUB8Q5SRo4jqQA');

// validateApiKey('google', 'AIzaSyAOLcB3r0YHsStXb5zL4mlEYnc5JeqY3lg');
validateApiKey({llmType:'ollama', endPoint:'http://localhost:11434', model:'granite3-dense:2b'})

openai needs {llmType:'openai', model: , apiKey:'AIzaSyAOLcB3r0YHsStXb5zL4mlEYnc5JeqY3lg'}
google needs {llmType:'google', apiKey:'AIzaSyAOLcB3r0YHsStXb5zL4mlEYnc5JeqY3lg'}
ollama needs {llmType:'ollama', endPoint:'http://localhost:11434', model:'granite3-dense:2b'}
