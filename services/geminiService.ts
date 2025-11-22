import { GoogleGenAI, Type, Modality } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    // Safely access process.env for browser environments
    this.apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  hasKey(): boolean {
    return !!this.apiKey;
  }

  private cleanJson(text: string): string {
    // Remove Markdown code blocks
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    // Find the first '{' and last '}' to ensure we have a valid object
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
  }

  // ---------------------------------------
  // TTS (Text-to-Speech)
  // ---------------------------------------
  async speak(text: string): Promise<ArrayBuffer | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Options: Puck, Charon, Kore, Fenrir, Zephyr
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      return null;
    } catch (e) {
      console.error("TTS Error:", e);
      return null;
    }
  }

  // ---------------------------------------
  // CHAT 1: OPERATIONS (Assistant - requires strict JSON)
  // ---------------------------------------
  async parseOperationalCommand(
    input: string, 
    context: { salesToday: number, expensesToday: number, menu: string }
  ): Promise<{ 
    actions: Array<{ type: string, data: any }>, 
    confirmationText: string
  } | null> {
    
    const prompt = `
      You are the Smart Cashier Assistant for a Doner Shop.
      
      MENU ITEMS & IDs:
      ${context.menu}

      Current Stats: Sales Today: ${context.salesToday} RUB, Expenses: ${context.expensesToday} RUB.

      USER SAYS: "${input}"
      
      YOUR TASK:
      1. Identify ALL actions (Sales and/or Expenses).
      2. If item is not in menu (e.g. "Adrenaline"), use ID "custom_item" and the price from user input.
      3. 'confirmationText' must be a polite summary in Russian.
      4. IMPORTANT: Output strictly valid JSON.
      
      OUTPUT JSON SCHEMA:
      {
        "actions": [
          {
             "type": "add_sale" | "add_expense" | "info",
             "data": {
                // For add_sale
                "items": [ 
                   { "id": "sh_classic", "name": "Шаурма", "price": 300, "quantity": 2 },
                   { "id": "custom_item", "name": "Adrenaline", "price": 150, "quantity": 1 }
                ],
                "paymentMethod": "Наличные" | "Карта",
                
                // For add_expense
                "amount": number,
                "category": "Ингредиенты" | "Зарплата" | "Такси" | "Уборка" | "Прочее",
                "description": string,
                "inventoryType": "lavash" | "bread_big" | "bread_small" | "none",
                "inventoryQty": number
             }
          }
        ],
        "confirmationText": string
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              confirmationText: { type: Type.STRING },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["add_sale", "add_expense", "info"] },
                    data: { 
                      type: Type.OBJECT, 
                      nullable: true,
                      properties: {
                        items: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING, nullable: true },
                              name: { type: Type.STRING },
                              price: { type: Type.NUMBER },
                              quantity: { type: Type.NUMBER }
                            }
                          }
                        },
                        paymentMethod: { type: Type.STRING, nullable: true },
                        amount: { type: Type.NUMBER, nullable: true },
                        category: { type: Type.STRING, nullable: true },
                        description: { type: Type.STRING, nullable: true },
                        inventoryType: { type: Type.STRING, nullable: true },
                        inventoryQty: { type: Type.NUMBER, nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const cleanText = this.cleanJson(response.text || '{}');
      return JSON.parse(cleanText);
    } catch (error) {
      console.error("Gemini Ops Error:", error);
      return null;
    }
  }

  // ---------------------------------------
  // CHAT 2: ANALYST (Business Coach - Free text)
  // ---------------------------------------
  async getAnalystAdvice(
    historyJSON: string, 
    userQuery: string
  ): Promise<{ text: string }> {
    
    const prompt = `
      You are a Brutally Honest & Strategic Business Analyst for a Doner Kebab business.
      
      REAL-TIME DATA (JSON):
      ${historyJSON}

      USER QUERY: "${userQuery}"

      INSTRUCTIONS:
      1. Analyze the provided JSON data (sales, expenses, timestamps).
      2. Be EXTREMELY CONCISE. No fluff.
      3. Use Bullet Points.
      4. Provide specific numbers (e.g., "Profit is X", "Margin is Y%").
      5. Suggest immediate actions.
      6. Language: Russian.
      7. Tone: Professional, Direct, "Wall Street" style.

      Example Output:
      * 📉 **Margin Low**: Food cost is 45% of revenue. Target 30%.
      * 💰 **Revenue**: 15,000 RUB today.
      * 💡 **Action**: Increase price of "Shawarma XL" by 20 RUB.
    `;

    try {
      // Using gemini-2.5-flash ensures compatibility with most API keys while still providing good reasoning
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return { text: response.text || "Анализ невозможен." };

    } catch (error: any) {
      console.error("Analyst Error:", error);
      
      let errorMsg = "Ошибка связи с аналитическим центром.";
      if (error.message?.includes('403')) {
         errorMsg = "Ошибка доступа (403). Убедитесь, что API ключ активен.";
      }
      return { text: errorMsg };
    }
  }
}