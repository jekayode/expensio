import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export async function parseReceipt(imageFile: File) {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });

    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Image = base64Data.split(",")[1];

    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    1. "store": The name of the store or merchant.
    2. "date": The date of the transaction (ISO 8601 format YYYY-MM-DD if possible, otherwise as appears).
    3. "items": A list of items purchased. Each item should have:
        - "name": The name of the product.
        - "amount": The price of the item (as a number).
        - "category": A suggested category for this item (e.g., Food, Transport, Utilities, Shopping, Entertainment).
    4. "total": The total amount of the receipt (as a number).

    Return ONLY the raw JSON object, no markdown formatting or backticks.
    `;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: imageFile.type,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up any potential markdown formatting if the model ignores the instruction
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error parsing receipt with Gemini:", error);
        throw error;
    }
}
