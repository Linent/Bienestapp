
class MessageHandler {
    async handleIncomingMessage(message){
        try {
            if (message?.type==='text') {
                const response =  `Echo: ${message.text.body}`;
                await whatsappService.sendMessage(message.form, response, message.id);
                await whatsappService.markAsRead(message.id);
            }
        } catch (error) {
            console.error(error);
        }
        
    }
    async isGreeting(message){
        
    }
}

export default new MessageHandler();