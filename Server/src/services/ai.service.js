/**
 * AI Service
 * Handles integration with LLM providers for generating summaries, action items, and suggested titles
 * Supports model fallback and retries for Google Gemini models
 */

/**
 * Generate AI metadata (summary, action items, suggested title) from note content
 * 
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @returns {Promise<Object>} AI-generated metadata object
 */
export const generateAIMetadata = async (title, content) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set. Returning placeholder metadata.');
      return getPlaceholderMetadata(title, content);
    }

    // Model candidates (ordered). You can override with GEMINI_MODEL_CANDIDATES env e.g. "gemini-2.5-flash,gemini-2.0-flash"
    const modelCandidates = (process.env.GEMINI_MODEL_CANDIDATES || 'gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash')
      .split(',').map(s => s.trim()).filter(Boolean);

    const prompt = `You are an expert note summarization AI. Your task is to analyze the following note and extract key information.\n\nIMPORTANT:\n- Create a SHORT, CONCISE summary (2-3 sentences MAX) that captures the MAIN IDEA, not the full content\n- Extract actual action items (tasks to do), not just repeat the content\n- Suggest a better title if possible\n\nNote Title: ${title}\nNote Content: ${content}\n\nReturn ONLY valid JSON (no other text):\n{\n  "summary": "Brief 2-3 sentence summary of main points only",\n  "action_items": ["specific task 1", "specific task 2", "specific task 3"],\n  "suggested_title": "More descriptive title or keep original"\n}`;

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    const maxAttemptsPerModel = 2;
    const backoffMs = (attempt) => 300 * attempt;

    let lastError = null;

    for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
        try {
          console.log(`📡 Calling Gemini model=${model} attempt=${attempt}`);

          const res = await fetch(`${baseUrl}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 800 }
            }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error(`❌ Gemini ${model} returned ${res.status} ${res.statusText}`);
            console.error('Response body:', text);
            lastError = new Error(`Gemini ${model} returned ${res.status}`);
            if (res.status >= 500 && attempt < maxAttemptsPerModel) {
              await new Promise(r => setTimeout(r, backoffMs(attempt)));
              continue; // retry same model
            }
            break; // try next model
          }

          const data = await res.json();
          console.log('📥 Gemini API raw response:', JSON.stringify(data, null, 2));

          // Potential places where the model may put the text
          let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.candidates?.[0]?.text
            || data?.output?.[0]?.content?.text
            || data?.text
            || null;

          // Fallback: try to find JSON substring in the whole payload
          if (!aiText) {
            const concat = JSON.stringify(data);
            const jsonMatch = concat.match(/\{[\s\S]*\}/);
            if (jsonMatch) aiText = jsonMatch[0];
          }

          if (!aiText) {
            console.warn('⚠️ No AI text found in response for model', model);
            lastError = new Error('No aiText in response');
            continue; // try next model
          }

          console.log('📝 AI text snippet:', aiText.substring(0, 800));

          // Attempt to parse aiText as JSON
          let parsed = null;
          try { parsed = JSON.parse(aiText); } catch (e) {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try { parsed = JSON.parse(jsonMatch[0]); } catch (e2) { parsed = null; }
            }
          }

          if (!parsed) {
            console.warn('⚠️ Unable to parse AI text as JSON for model', model);
            lastError = new Error('Unable to parse AI JSON');
            continue; // try next model
          }

          const finalMetadata = {
            summary: parsed.summary || parsed.summary_text || parsed.summaryText || '',
            action_items: Array.isArray(parsed.action_items) ? parsed.action_items : (Array.isArray(parsed.actionItems) ? parsed.actionItems : []),
            suggested_title: parsed.suggested_title || parsed.suggestedTitle || title,
          };

          console.log('\n🎯 FINAL AI METADATA BEING RETURNED:');
          console.log(JSON.stringify(finalMetadata, null, 2));
          console.log('\n');

          return finalMetadata;
        } catch (err) {
          console.error(`❌ Error calling Gemini model ${model} attempt=${attempt}:`, err?.message || err);
          lastError = err;
          if (attempt < maxAttemptsPerModel) await new Promise(r => setTimeout(r, backoffMs(attempt)));
        }
      }
    }

    console.error('❌ All Gemini model attempts failed:', lastError?.message || lastError);
    return getPlaceholderMetadata(title, content);
  } catch (error) {
    console.error('❌ AI metadata generation error (outer):', error?.message || error);
    return getPlaceholderMetadata(title, content);
  }
};

/**
 * Fallback placeholder metadata when AI is unavailable
 * 
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @returns {Object} Placeholder AI metadata
 */
const getPlaceholderMetadata = (title, content) => {
  const summary = (content || '').substring(0, 200).replace(/\s+/g, ' ').trim() + (content && content.length > 200 ? '...' : '');
  return {
    summary: summary || `Note: ${title}`,
    action_items: [],
    suggested_title: title,
  };
};

/**
 * Check if content has sufficient depth for AI analysis
 * 
 * @param {string} content - Note content
 * @returns {boolean}
 */
export const isContentAnalyzable = (content) => {
  const minLength = 50;
  return content && content.trim().length >= minLength;
};
