const { handler } = require('../netlify/functions/chatbot');

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            startChat: jest.fn().mockReturnValue({
                sendMessage: jest.fn().mockResolvedValue({
                    response: {
                        text: jest.fn().mockReturnValue('This is a test response from Gemini.')
                    }
                })
            })
        })
    }))
}));

const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('Chatbot Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock environment variable
        process.env.GEMINI_API_KEY = 'AIzaSyBRDrLF5BZuAOazd5vhZnYtEDAGTlDMlB0';
    });

    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
    });

    test('should handle OPTIONS request', async () => {
        const event = {
            httpMethod: 'OPTIONS',
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(result.body).toBe('');
    });

    test('should return 405 for non-POST methods', async () => {
        const event = {
            httpMethod: 'GET',
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(405);
        expect(JSON.parse(result.body).error).toBe('Method not allowed');
    });

    test('should return 400 for invalid JSON', async () => {
        const event = {
            httpMethod: 'POST',
            body: 'invalid json',
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Invalid JSON in request body');
    });

    test('should return 400 for missing message', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({}),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Message is required and must be a non-empty string');
    });

    test('should return 400 for empty message', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: '   ' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Message is required and must be a non-empty string');
    });

    test('should return 400 for non-string message', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 123 }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Message is required and must be a non-empty string');
    });

    test('should return successful response for valid message', async () => {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'What is Sentra?' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe('This is a test response from Gemini.');
        expect(GoogleGenerativeAI).toHaveBeenCalledWith('AIzaSyTestKey123');
        expect(GoogleGenerativeAI.mock.results[0].value.getGenerativeModel).toHaveBeenCalledWith({
            model: 'gemini-1.5-flash',
            systemInstruction: expect.stringContaining('Sentra')
        });
    });

    test('should handle Gemini API error', async () => {
        // Mock sendMessage to throw an error
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                startChat: jest.fn().mockReturnValue({
                    sendMessage: jest.fn().mockRejectedValue(new Error('API_KEY_INVALID'))
                })
            })
        }));

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'Test question' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe("The AI model is not available or the API key is invalid. Please contact support.");
    });

    test('should handle quota exceeded error', async () => {
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                startChat: jest.fn().mockReturnValue({
                    sendMessage: jest.fn().mockRejectedValue(new Error('RESOURCE_EXHAUSTED'))
                })
            })
        }));

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'Test question' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe("The AI service is currently overloaded. Please try again later.");
    });

    test('should handle generic API error', async () => {
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                startChat: jest.fn().mockReturnValue({
                    sendMessage: jest.fn().mockRejectedValue(new Error('Some other error'))
                })
            })
        }));

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'Test question' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe("I'm experiencing technical difficulties with the AI service. Please try again later.");
    });

    test('should return error when GEMINI_API_KEY is not set', async () => {
        delete process.env.GEMINI_API_KEY;

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'Test question' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe("I'm sorry, but the AI service is not configured. Please contact support.");
    });

    test('should return error when GEMINI_API_KEY is malformed', async () => {
        process.env.GEMINI_API_KEY = 'invalid-key';

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ message: 'Test question' }),
            headers: {}
        };

        const result = await handler(event, {});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).answer).toBe("I'm sorry, but the AI service is not configured properly. Please contact support.");
    });
});