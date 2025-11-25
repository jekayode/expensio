"use server";

import OpenAI from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

export async function scanReceiptAction(formData: FormData) {
    const file = formData.get("file") as File;
    const savedReceiptUrl = formData.get("savedReceiptUrl") as string;

    if (!file) {
        throw new Error("No file provided");
    }

    if (!API_KEY) {
        throw new Error("OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env.local file.");
    }

    try {
        const openai = new OpenAI({ apiKey: API_KEY });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64Image}`;

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

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                "url": dataUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const text = response.choices[0].message.content || "{}";
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = JSON.parse(cleanText);

        // Append the saved receipt URL to the response
        return {
            ...parsedData,
            receiptUrl: savedReceiptUrl
        };

    } catch (error: any) {
        console.error("Server Action Scan Error:", error);
        throw new Error(`Scan failed: ${error.message}`);
    }
}
