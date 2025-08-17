// This is a Vercel Serverless Function that acts as a secure proxy.
// The secret key check has been removed, so it can be accessed from any browser.

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get topic and level from the request body sent by the frontend
    const { topic, level, history } = request.body;

    // Securely get the API key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // If the API key is not set on the server, return an error
      return response.status(500).json({ error: 'API key is not configured on the server.' });
    }
    
    // Construct the prompt for the AI model
    let historyPrompt = "";
    if (history && history.length > 0) {
        const recentQuestions = history.slice(-5).join('", "');
        historyPrompt = `Please generate a new and different question that is not similar to these previous questions: ["${recentQuestions}"].`;
    }

    const prompt = `
        Generate a multiple-choice quiz question in Bengali about the topic: "${topic}".
        The difficulty level or category of the question should be "${level}".
        ${historyPrompt}
        Provide the response in a clean JSON format without any extra text or markdown formatting.
        The JSON object must have these exact keys: "question", "options", and "correct_answer".
        Example format:
        {
          "question": "বাংলাদেশের জাতীয় ফলের নাম কি?",
          "options": ["আম", "কাঁঠাল", "লিচু", "জাম"],
          "correct_answer": "কাঁঠাল"
        }
    `;

    // Prepare the payload for the Google Gemini API
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    };

    const modelName = "gemini-2.5-flash-preview-05-20";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Call the Google Gemini API from the server
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      // Forward the error from Google's API to our frontend for better debugging
      return response.status(geminiResponse.status).json({ error: `Error from AI Service: ${errorData.error.message}` });
    }

    const result = await geminiResponse.json();

    // Send the successful response back to the frontend
    response.status(200).json(result);

  } catch (error) {
    console.error('Internal server error:', error);
    response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
