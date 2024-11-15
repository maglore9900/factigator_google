import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory
} from './node_modules/@google/generative-ai/dist/index.js';


// Updated Adapter class
class Adapter {
  constructor(settings) {
    this.settings = settings;
    this.llmText = settings.llmType.toLowerCase();
    console.log('LLM Type:', this.llmText)
    this.openAIApiKey = settings.openaiApiKey;
    this.openaiModel = settings.openaiModel;
    this.ollamaEndpoint = settings.ollamaEndpoint;
    this.ollamaModel = settings.ollamaModel;
    this.googleApiKey = settings.googleApiKey
  }

  async init() {
    // Load settings from Chrome's local storage
    // const settings = await this.loadSettings();

    if (!this.settings || !this.settings.llmType) {
      throw new Error('LLM_TYPE is not defined in local storage');
    }
    // this.llmText = settings.llmType.toLowerCase();

    if (this.llmText === 'openai') {
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOpenAI({
        temperature: 0.3,
        model: this.openaiModel,
        openAIApiKey: this.openAIApiKey
      });
    } else if (this.llmText === 'ollama') {
      this.prompt = ChatPromptTemplate.fromTemplate('answer the following request: {topic}');
      this.llmChat = new ChatOllama({
        baseUrl: this.ollamaEndpoint,
        model: this.ollamaModel
      });
    } else if (this.llmText === 'google') {
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ];
      let generationConfig = {
        temperature: 1
      };
      const genAI = new GoogleGenerativeAI(this.googleApiKey);  // Declare genAI here
      this.llmChat = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings,
        generationConfig  // Ensure this is defined
      });
    } else {
      throw new Error('Invalid LLM_TYPE specified in local storage');
    }
  }

  async chat(query) {
    if (!this.llmChat) {
      await this.init(); // Ensure initialization
    }
    try {
      console.log(`Sending query to LLM: ${query} to ${this.llmText}`);
      let result;
      let output;
      if (this.llmText === !"google") {
        result = await this.llmChat.invoke(query);
        output = result.content
      } else {
        result = await this.llmChat.generateContent(query);
        output = result.response.text()
      }
      // let result = await this.llmChat.generateContent(query)
      // console.log(`Received response from LLM: ${JSON.stringify(result.content)}`);
      console.log(`Received response from LLM: ${JSON.stringify(output)}`);
      return JSON.stringify(output);
    } catch (error) {
      console.error(`Error in adapter.chat(): ${error.message}`);
      throw error; // Re-throw to catch it in performFactCheck
    }
  }
}

export default Adapter;

// (async () => {
//   const settings = {
//      llmType: 'google', // or 'ollama'
//      openaiApiKey: 'your_openai_api_key',
//      openaiModel: 'text-davinci-003',
//      ollamaEndpoint: 'http://localhost:11434',
//      ollamaModel: 'llama3.2:3b',
//      googleApiKey: 'AIzaSyAOLcB3r0YHsStXb5zL4mlEYnc5JeqY3lg'
//    };

//    const adapter = new Adapter(settings);

//    try {
//      await adapter.init();
//      const response = await adapter.chat('Write a story about a magic backpack.');
//      console.log('Chat response:', response);
//    } catch (error) {
//      console.error('An error occurred:', error);
//    }
//  })();



 // import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI('AIzaSyAOLcB3r0YHsStXb5zL4mlEYnc5JeqY3lg');
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// const prompt = "Write a story about a magic backpack.";

// const result = await model.generateContent(prompt);
// console.log(result.response.text());