// Chatbot functionality
class SentraChatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        // Start the process: load HTML, then initialize.
        this.createChatbotHTML();
    }

    /**
     * Initializes DOM elements and binds events.
     * This is ONLY called *after* the HTML is guaranteed to be in the DOM.
     */
    init() {
        // Get DOM elements
        this.toggle = document.getElementById('chatbot-toggle');
        this.container = document.getElementById('chatbot-container');
        this.closeBtn = document.getElementById('chatbot-close');
        this.input = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('chatbot-send');
        this.messages = document.getElementById('chatbot-messages');
        this.typing = document.getElementById('chatbot-typing');

        // Check if all required elements exist
        if (!this.toggle || !this.container || !this.closeBtn || !this.input || !this.sendBtn || !this.messages || !this.typing) {
            console.error('Chatbot initialization failed: Some required DOM elements are missing. Ensure chatbot.html content is correct.');
            return;
        }

        // Bind events
        this.bindEvents();

        // Add an initial welcome message (optional, but good UX)
        this.addMessage("Hello! I'm Sentra's AI assistant. Ask me about our structural monitoring products and solutions!", 'bot');
    }

    /**
     * Loads the chatbot HTML structure asynchronously.
     */
    createChatbotHTML() {
        const widgetElement = document.getElementById('chatbot-widget');

        // Check if chatbot HTML already exists
        if (widgetElement) {
            // If it exists (e.g., loaded directly in index.html), proceed to init
            this.init();
            return;
        }

        // If it doesn't exist, fetch it
        fetch('./chatbot.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Inject the HTML into the body
                document.body.insertAdjacentHTML('beforeend', html);
                // 🔑 CRITICAL FIX: Now that the HTML is in the DOM, call init()
                this.init();
            })
            .catch(error => {
                console.error('Error loading chatbot HTML:', error);
            });
    }

    bindEvents() {
        try {
            this.toggle.addEventListener('click', () => this.toggleChat());
            this.closeBtn.addEventListener('click', () => this.closeChat());
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        } catch (error) {
            // Note: This block is less likely to hit now that init() is protected
            console.error('Error binding chatbot events:', error);
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.classList.add('open');
            this.input.focus();
        } else {
            this.container.classList.remove('open');
        }
    }

    closeChat() {
        this.isOpen = false;
        this.container.classList.remove('open');
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            // Send to Netlify function
            const response = await fetch('/.netlify/functions/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                this.hideTyping();
                this.addMessage('Sorry, I received an invalid response. Please try again.', 'bot');
                return;
            }

            // Hide typing indicator
            this.hideTyping();

            if (response.ok) {
                if (data.answer) {
                    this.addMessage(data.answer, 'bot');
                } else {
                    this.addMessage('Sorry, I couldn\'t generate a response. Please try again.', 'bot');
                }
            } else {
                // Handle specific error messages
                if (data.error) {
                    this.addMessage(`Sorry, there was an error: ${data.error}`, 'bot');
                } else {
                    this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTyping();
            this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';

        const icon = document.createElement('i');
        // IMPORTANT: Ensure you have Font Awesome loaded for these icons (fas fa-robot/fas fa-user)
        icon.className = type === 'bot' ? 'fas fa-robot' : 'fas fa-user';
        avatarDiv.appendChild(icon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        contentDiv.appendChild(paragraph);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        this.isTyping = true;
        this.typing.style.display = 'block';
        this.sendBtn.disabled = true;
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.typing.style.display = 'none';
        this.input.focus();
        this.sendBtn.disabled = false;
    }

    scrollToBottom() {
        // Use a slight delay to ensure the DOM has rendered the new message height
        setTimeout(() => {
            this.messages.scrollTop = this.messages.scrollHeight;
        }, 100);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new SentraChatbot();
    } catch (error) {
        console.error('Error initializing chatbot from DOMContentLoaded:', error);
    }
});

/*
// Remove this redundant block, as DOMContentLoaded is the standard and sufficient event.
if (document.readyState !== 'loading') {
    try {
        new SentraChatbot();
    } catch (error) {
        console.error('Error initializing chatbot:', error);
    }
}
*/