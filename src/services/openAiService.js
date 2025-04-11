import OpenAi from 'openai';
import config from '../config/config.js';
import { errorsConstants } from '../constants/errors.constant.js';
import { handlerError } from '../handlers/errors.handlers.js';
import bienestarPrompt from'../utils/promps.js';
const client = new OpenAi({
  apiKey: config.CHATGPT_API_KEY,  
});

const openAiService = async (message) => {
    try {
        const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: bienestarPrompt },{ role: 'user', content: message }],
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error in OpenAI service:', error);
    }
    }

export default openAiService;
