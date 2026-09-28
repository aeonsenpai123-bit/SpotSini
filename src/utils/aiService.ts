const LOCAL_API_ENDPOINT = 'http://localhost:20128/v1/chat/completions';

const SYSTEM_INSTRUCTION = `import os
from google import genai

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

tools = [
    {
        'type': 'google_search',
    },
]

generation_config = {
    'temperature': 1,
    'max_output_tokens': 65536,
    'top_p': 0.95,
    'thinking_level': 'high',
}

interaction = client.interactions.create(
    model='models/gemini-3-flash-preview',
    input="""INSERT_INPUT_HERE""",
    tools=tools,
    generation_config=generation_config,
)

print(interaction.steps[-1])`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function fetchLocalAiChat(userMessage: string): Promise<string> {
  const payload = {
    model: 'gemini-1.5-flash',
    messages: [
      {
        role: 'system',
        content: SYSTEM_INSTRUCTION
      },
      {
        role: 'user',
        content: userMessage
      }
    ]
  };

  const response = await fetch(LOCAL_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-lokal-123'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API lokal merespons dengan status HTTP ${response.status} (${response.statusText})`);
  }

  const data = await response.json();

  // Parsing OpenAI / Gemini chat completions format
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? data?.content ?? '';

  if (!content) {
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  }

  return content.trim();
}

/**
 * Helper khusus untuk membuat deskripsi usaha mikro otomatis
 */
export async function generateBusinessDescription(params: {
  businessName: string;
  ownerName: string;
  sector: string;
  rwRt: string;
  featuredProducts: string;
}): Promise<string> {
  const prompt = `Tolong buatkan deskripsi profil usaha mikro yang menarik, ramah, profesional, dan menggugah minat warga lokal Kelurahan Penggilingan (sekitar 2-3 kalimat):
- Nama Usaha: ${params.businessName || 'Usaha Mikro'}
- Pemilik: ${params.ownerName || 'Warga Penggilingan'}
- Sektor: ${params.sector}
- Wilayah Domisili: ${params.rwRt}
- Produk/Layanan Unggulan: ${params.featuredProducts || 'Produk lokal berkualitas'}

Tulis langsung deskripsinya tanpa kalimat pembuka atau penutup.`;

  return await fetchLocalAiChat(prompt);
}
