import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, grade, current_grade_value, max_grade, notes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `أنت مساعد تعليمي متخصص. أنشئ خطة دراسية مفصلة باللغة العربية للطالب بناءً على المعلومات التالية:
- المادة: ${subject}
- المرحلة الدراسية: ${grade}
- الدرجة الحالية: ${current_grade_value}/${max_grade}
- ملاحظات إضافية: ${notes || "لا توجد"}

أنشئ خطة دراسية عملية تتضمن:
1. تحليل نقاط القوة والضعف
2. أهداف أسبوعية محددة
3. جدول يومي مقترح
4. نصائح للتحسين
5. مصادر مقترحة

اكتب الخطة بشكل منظم وواضح.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت مساعد تعليمي خبير في إنشاء خطط دراسية مخصصة. أجب دائماً باللغة العربية." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const plan = data.choices?.[0]?.message?.content || "لم يتم إنشاء الخطة";

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
