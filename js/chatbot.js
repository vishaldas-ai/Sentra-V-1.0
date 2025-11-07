const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// -----------------------------------------------------------------
// 🚨 CRITICAL SECURITY WARNING
// -----------------------------------------------------------------
// DO NOT put your API key in client-side JavaScript.
// Anyone visiting your site can steal it and use your quota.
// This key should be in a backend server.
//
// For testing, you can use it here, but replace it before deploying.
// -----------------------------------------------------------------
const API_KEY = "AIzaSyBRDrLF5BZuAOazd5vhZnYtEDAGTlDMlB0"; // ⚠️ Replace this

// API setup - Changed to v1beta, which works with gemini-1.5-flash-latest
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mimeType: null, // <-- FIX: Changed from mime_type
  },
};

// Store chat history - Now starts empty.
const chatHistory = [];

// System instruction with company context
const systemInstruction = {
  parts: [
    {
      text: `Company Name: Sentra
Sentra is a structural health monitoring and digital engineering company specializing in real-time infrastructure intelligence.
We integrate smart sensor networks, digital twins, and edge AI for predictive maintenance, fatigue analysis, and geotechnical monitoring.
Our solutions help detect early signs of stress, displacement, vibration, and material degradation across bridges, tunnels, buildings, and other critical assets.
Sentra also provides consulting and advisory services, foundation and geotechnical monitoring, fatigue and residual life assessment, and digital documentation of infrastructure assets.
Use this company context to answer all upcoming user queries accurately and in alignment with Sentra's expertise.`,
    },
  ],
};

const initialInputHeight = messageInput.scrollHeight;

// Simple markdown parser for basic formatting
const parseMarkdown = (text) => {
  let parsed = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // H2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // H1
    .replace(/^- (.*$)/gim, '• $1') // Bullet points with -
    .replace(/^\* (.*$)/gim, '• $1') // Bullet points with *
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic (after bullets)
    .replace(/^---$/gm, '<hr>'); // Horizontal rules

  // Basic table parsing
  const lines = parsed.split('\n');
  let inTable = false;
  let tableRows = [];
  let newLines = [];

  for (let line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      tableRows.push(cells);
    } else {
      if (inTable) {
        // End table
        let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        tableRows.forEach((row, index) => {
          const tag = index === 1 ? 'th' : 'td';
          tableHtml += '<tr>';
          row.forEach(cell => {
            tableHtml += `<${tag} style="padding: 8px; text-align: left;">${cell}</${tag}>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</table>';
        newLines.push(tableHtml);
        inTable = false;
      }
      newLines.push(line);
    }
  }
  if (inTable) {
    let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    tableRows.forEach((row, index) => {
      const tag = index === 1 ? 'th' : 'td';
      tableHtml += '<tr>';
      row.forEach(cell => {
        tableHtml += `<${tag} style="padding: 8px; text-align: left;">${cell}</${tag}>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table>';
    newLines.push(tableHtml);
  }

  return newLines.join('<br>');
};

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Create the parts for the user's message
  const userParts = [{ text: userData.message }];
  if (userData.file.data) {
    // Add file data if it exists
    userParts.push({
      inline_data: userData.file, // This now correctly has { data: "...", mimeType: "..." }
    });
  }

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: userParts,
  });

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory,
      systemInstruction: systemInstruction, // <-- ADDED: Send system context
    }),
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      // Check for specific error message from Google
      if (data.error && data.error.message) {
        throw new Error(data.error.message);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check for valid response structure
    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error("Invalid API response structure.");
    }

    // Extract and display bot's response text
    const apiResponseText = data.candidates[0].content.parts[0].text.trim();
    messageElement.innerHTML = parseMarkdown(apiResponseText);

    // Add bot response to chat history
    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    });
  } catch (error) {
    // Handle error in API response
    console.error(error); // Log the full error to the console
    messageElement.innerText = `Error: ${error.message}`;
    messageElement.style.color = "#ff0000";
  } finally {
    // Reset user's file data, removing thinking indicator and scroll chat to bottom
    userData.file = { data: null, mimeType: null }; // Reset file data
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  
  // Do nothing if message and file are empty
  if (!userData.message && !userData.file.data) {
    messageInput.value = "";
    return;
  }

  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${
                            userData.file.data
                              ? `<img src="data:${userData.file.mimeType};base64,${userData.file.data}" class="attachment" />`
                              : ""
                          }`;
  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
            />
          </svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  const fileUploaded = userData.file.data;
  
  if (e.key === "Enter" && !e.shiftKey && (userMessage || fileUploaded) && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Simple validation for image types (optional but recommended)
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file (e.g., JPEG, PNG, WEBP).");
    fileInput.value = ""; // Clear the input
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];
    
    // Store file data in userData
    userData.file = {
      data: base64String,
      mimeType: file.type, // <-- FIX: Use mimeType
    };
  };
  reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = { data: null, mimeType: null };
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Assume EmojiMart is loaded correctly in your HTML
// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});
document.querySelector(".chat-form").appendChild(picker);

// --- Event Listeners ---
sendMessage.addEventListener("click", (e) => {
  const userMessage = messageInput.value.trim();
  const fileUploaded = userData.file.data;
  if (userMessage || fileUploaded) {
    handleOutgoingMessage(e);
  }
});
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));