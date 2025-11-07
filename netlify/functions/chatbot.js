import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: '',
        };
    }

    try {
        const { question } = JSON.parse(event.body);

        if (!question || typeof question !== 'string') {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ error: 'Question is required and must be a string' }),
            };
        }

        // Initialize Gemini Flash Latest model
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Create a system prompt for Sentra's structural monitoring context
        const systemPrompt = `You are Sentra's AI assistant, specializing in structural health monitoring, IoT sensors, and infrastructure monitoring solutions. You help customers understand:

Products and Solutions:
- Structural Health Monitoring (SHM) systems
- IoT sensors (accelerometers, strain gauges, tiltmeters, vibration meters)
- Data loggers (analog, digital, PicoNode)
- Communication devices (gateways, repeaters, Thread X3)
- GNSS meters for precise positioning
- Laser tiltmeters and vibrating wire sensors
- Non-destructive testing (NDT) services
- Consulting and advisory services
- Digital engineering and documentation
- Fatigue and residual life assessment
- Geotechnical and foundation monitoring
- Bridge inspection and condition assessment
- Asset monitoring and management

Key Capabilities:
- Real-time monitoring of structural integrity
- Early warning systems for potential failures
- Data collection and analysis for infrastructure
- Predictive maintenance solutions
- Custom sensor deployments
- Integration with existing systems

When answering questions:
- Be helpful, professional, and informative
- Focus on Sentra's expertise in structural monitoring
- Provide specific product information when relevant
- Suggest appropriate solutions based on the query
- Keep responses concise but comprehensive
- Use plain text only, avoid markdown formatting like **bold** or tables
- If you don't have specific information, suggest contacting Sentra directly

Question: ${question}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const answer = response.text();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answer }),
        };

    } catch (error) {
        console.error('Error processing chatbot request:', error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Internal server error. Please try again later.'
            }),
        };
    }
};