import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
import re

# Configure the Gemini API
genai.configure(api_key="AIzaSyCyq5GEYq00kid_Uz7qfa1hQu7R5X1t2Rg")
model = genai.GenerativeModel("gemini-2.0-flash")

# Generation configuration for concise responses
generation_config = {
    "temperature": 0.7,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 300,  # Reduced from default
}

app = Flask(__name__)
CORS(app)

# Greeting patterns
GREETINGS = [
    r'hii\b',r'hi\b', r'hello\b', r'hey\b', r'greetings\b',
    r'good morning\b', r'good afternoon\b', r'good evening\b'
]

def is_greeting(message):
    message_lower = message.lower()
    return any(re.search(pattern, message_lower) for pattern in GREETINGS)

def is_tech_related(question):
    if is_greeting(question):
        return True
    
    tech_keywords = [
        'tech', 'computer', 'software', 'hardware', 'ai', 'programming',
        'code', 'algorithm', 'data', 'cyber', 'cloud', 'blockchain', 'iot',
        'vr', 'ar', 'robot', 'gadget', 'device', 'phone', 'laptop', 'cpu',
        'gpu', 'startup', 'google', 'apple', 'microsoft', 'amazon', 'meta',
        'nvidia', 'intel', 'quantum', '5g', 'wifi', 'crypto', 'bitcoin',
        'web3', 'metaverse', 'chatbot', 'neural', 'deep learning', 'database',
        'server', 'linux', 'windows', 'macos', 'android', 'ios', 'python',
        'javascript', 'java', 'c\+\+', 'c#', 'html', 'css', 'react', 'node',
        'docker', 'api', 'frontend', 'backend', 'ui', 'ux', 'design', '3d',
        'drone', 'electric vehicle', 'ev', 'battery', 'nano', 'bio'
    ]
    
    question_lower = question.lower()
    return any(re.search(rf'\b{keyword}\b', question_lower) for keyword in tech_keywords)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'No message received'}), 400

    try:
        if is_greeting(user_message):
            responses = [
                "Hello! I'm Tech-Info AI. Ask me anything about technology!",
                "Hi there! I specialize in tech topics. What would you like to know?",
                "Greetings! I can help with technology questions. What's on your mind?"
            ]
            return jsonify({'response': responses[len(user_message) % len(responses)]})
        
        if not is_tech_related(user_message):
            return jsonify({'response': "I specialize in technology topics. Please ask about computers, software, AI, gadgets, or other tech-related subjects."})
        
        # Modified prompt for concise responses
        prompt = f"""Provide a concise and precise answer to the following tech question. 
        Keep the response under 150 words. Focus on key facts and avoid lengthy explanations.
        If the question is complex, break it into short, clear points.
        
        Question: {user_message}
        
        Answer:"""
        
        response = model.generate_content(prompt, generation_config=generation_config)
        return jsonify({'response': response.text})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)