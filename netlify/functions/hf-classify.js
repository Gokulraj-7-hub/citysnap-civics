// Netlify serverless function to proxy Hugging Face image classification
// This avoids CORS issues by making the API call from the server side

exports.handler = async function (event) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const HF_API_KEY = process.env.VITE_HUGGINGFACE_API_KEY;

    if (!HF_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing Hugging Face API key on server' })
        };
    }

    try {
        // Parse the incoming base64 image from the frontend
        const { imageBase64, mimeType } = JSON.parse(event.body);

        if (!imageBase64) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing imageBase64 in request body' }) };
        }

        // Convert base64 to binary buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Call Hugging Face router directly (server-to-server, no CORS)
        const hfResponse = await fetch(
            'https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': mimeType || 'image/jpeg',
                },
                body: imageBuffer
            }
        );

        const result = await hfResponse.json();

        return {
            statusCode: hfResponse.status,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };
    } catch (err) {
        console.error('HF proxy function error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
