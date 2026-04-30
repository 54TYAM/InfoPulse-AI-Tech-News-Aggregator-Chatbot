let recognition;
let isListening = false;
let speechSynthesis = window.speechSynthesis;
let isSpeechEnabled = false;
const chatHistory = document.getElementById('chatHistory');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const backendUrl = 'http://127.0.0.1:5000/chat';
const characterCounter = document.getElementById('characterCounter');
const MAX_MESSAGE_LENGTH = 150;
messageInput.addEventListener('input', () => {
    const length = messageInput.value.length;
    characterCounter.textContent = `${length}/${MAX_MESSAGE_LENGTH}`;
    if (length > MAX_MESSAGE_LENGTH) {
        characterCounter.style.color = '#ff5555';
    } else {
        characterCounter.style.color = '#666';
    }
});
async function checkMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        displayMessage("⛔ Please enable microphone access to use voice commands.", false);
        return false;
    }
}
async function toggleVoiceRecognition() {
    if (!recognition) {
        initVoiceRecognition();
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    // Check permissions before starting
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;

    try {
        recognition.start();
    } catch (error) {
        console.error('Voice recognition error:', error);
        displayMessage("⚠️ Voice recognition failed to start. Please refresh the page.", false);
    }
}
function initVoiceRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isListening = true;
        voiceButton.classList.add('active');
        displayMessage("🎤 Listening...", false);
    };

    recognition.onend = function() {
        isListening = false;
        voiceButton.classList.remove('active');
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        sendMessage();
    };

    recognition.onerror = function(event) {
        isListening = false;
        voiceButton.classList.remove('active');
        
        let errorMessage = "⚠️ Voice recognition error. Please try again.";
        switch(event.error) {
            case 'no-speech':
                errorMessage = "🔇 No speech detected. Please try again.";
                break;
            case 'audio-capture':
                errorMessage = "🎤 Microphone not available. Please check permissions.";
                break;
            case 'not-allowed':
                errorMessage = "⛔ Microphone access denied. Please enable permissions.";
                break;
        }
        
        displayMessage(errorMessage, false);
    };
}

function toggleVoiceRecognition() {
    if (!recognition) {
        initVoiceRecognition();
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Speech recognition start failed:', error);
            displayMessage('⚠️ Voice recognition not available. Please check your microphone permissions.', false);
        }
    }
}

function toggleSpeechOutput() {
    isSpeechEnabled = !isSpeechEnabled;
    speakerButton.classList.toggle('active', isSpeechEnabled);
    
    // Speak the current message if enabling
    if (isSpeechEnabled && chatHistory.lastElementChild && 
        !chatHistory.lastElementChild.classList.contains('user-message')) {
        speakMessage(chatHistory.lastElementChild.textContent);
    }
}

function speakMessage(message) {
    if (!isSpeechEnabled) return;
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Cancel any current speech
    speechSynthesis.cancel();
    
    // Speak the new message
    speechSynthesis.speak(utterance);
}

// Modify your displayMessage function to include speech
function displayMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    
    const formattedMessage = message.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" style="color: #00ff88; text-decoration: none;">$1</a>'
    );
    
    messageDiv.innerHTML = formattedMessage;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Speak the message if it's from the bot and speech is enabled
    if (!isUser && isSpeechEnabled) {
        speakMessage(message);
    }
}
function displayMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    
    // Format URLs as clickable links
    const formattedMessage = message.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" style="color: #00ff88; text-decoration: none;">$1</a>'
    );
    
    messageDiv.innerHTML = formattedMessage;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        displayMessage(message, true);
        messageInput.value = '';
        showTypingIndicator();

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            hideTypingIndicator();
            displayMessage(data.response, false);
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            displayMessage('⚠️ Connection error. Please try again later.', false);
        }
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Auto-focus input on page load
window.addEventListener('load', () => {
    messageInput.focus();
});
const voiceButton = document.getElementById('voiceButton');
const speakerButton = document.getElementById('speakerButton');

voiceButton.addEventListener('click', toggleVoiceRecognition);
speakerButton.addEventListener('click', toggleSpeechOutput);
if (!('speechSynthesis' in window)) {
    speakerButton.style.display = 'none';
    console.warn('Text-to-speech not supported in this browser');
}

if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    voiceButton.style.display = 'none';
    console.warn('Speech recognition not supported in this browser');
}