import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI packing suggestions
app.post('/api/ai/suggest', async (req, res) => {
  const { destination, days, purpose, weather, bagTypes } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(200).json({
      fallback: true,
      message: 'Không tìm thấy API Key Gemini, sử dụng thuật toán gợi ý tối ưu có sẵn.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Bạn là chuyên gia chuẩn bị hành lý và sắp xếp đồ đạc du lịch chuyên nghiệp.
Hãy lập danh sách đồ đạc và phân bổ vào các túi/vali cho chuyến đi sau:
- Điểm đến: ${destination || 'Chung'}
- Thời gian: ${days || 3} ngày
- Mục đích: ${purpose || 'Du lịch'}
- Thời tiết: ${weather || 'Nắng đẹp'}
- Các loại túi người dùng dự định mang: ${bagTypes?.join(', ') || 'Vali chính, Balo xách tay, Túi mỹ phẩm/phụ kiện'}

Hãy trả về kết quả định dạng JSON thuần tuý (không kèm markdown codeblock hay văn bản khác) với schema sau:
{
  "tripTitle": "Tên chuyến đi",
  "recommendedBags": [
    {
      "name": "Tên túi/vali (ví dụ: Vali ký gửi 24 inch)",
      "type": "suitcase" | "backpack" | "duffel" | "tote" | "box" | "pouch",
      "color": "slate" | "blue" | "emerald" | "amber" | "rose" | "purple" | "teal",
      "maxWeightKg": 20,
      "note": "Ghi chú mục đích túi",
      "compartments": ["Ngăn chính", "Ngăn phụ"]
    }
  ],
  "items": [
    {
      "name": "Tên đồ vật",
      "category": "clothing" | "toiletries" | "electronics" | "documents" | "medical" | "footwear" | "accessories" | "other",
      "suggestedBagName": "Tên túi mà món đồ này nên thuộc về (khớp với recommendedBags)",
      "quantity": 2,
      "weightGrams": 300,
      "priority": "essential" | "recommended" | "optional",
      "notes": "Lưu ý nếu có (ví dụ: cấm ký gửi pin)"
    }
  ],
  "packingTips": [
    "Mẹo 1 khi xếp vali",
    "Mẹo 2",
    "Mẹo 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating packing suggestions:', error);
    return res.status(500).json({
      error: 'Không thể kết nối AI, vui lòng sử dụng mẫu gợi ý có sẵn.',
      details: error?.message
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
