const OpenAi = require ('openai');
const config = require ('../config/config.js');
const { errorsConstants } = require ('../constants/errors.constant.js');
const { handlerError } = require ('../handlers/errors.handlers.js');
const bienestarPrompt = require ('../utils/promps.js');
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

    module.exports = openAiService;