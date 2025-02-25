// This file can be removed if we're not using AI analysis anymore
// Or update it to only handle non-predefined professions

import { serve } from "./deps.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_API_URL = "https://api.deepseek.ai/v1/chat/completions";

interface RequestBody {
  prompt: string;
  systemPrompt?: string;
}

serve(async (req) => {
  try {
    const { prompt } = await req.json();

    // Step 1: Validate if this is a real profession
    const validationResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a strict profession validator. 
            If the input is not a real profession, respond with INVALID.
            If it's a misspelling, respond with SUGGESTION: followed by the correct profession.
            If it's valid, respond with VALID: followed by the standardized name.
            
            Example responses:
            "abc" -> INVALID: Not a recognized profession
            "techer" -> SUGGESTION: Did you mean "Teacher"?
            "doctor" -> VALID: Doctor`
          },
          {
            role: "user",
            content: `Validate this profession: "${prompt}"`
          }
        ],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    const validationData = await validationResponse.json();
    const validationResult = validationData.choices[0].message.content.trim();

    // Handle invalid professions
    if (validationResult.startsWith("INVALID:")) {
      return new Response(
        JSON.stringify({
          error: "Invalid profession",
          details: validationResult.substring(8).trim(),
          isValid: false
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle suggestions for misspellings
    if (validationResult.startsWith("SUGGESTION:")) {
      return new Response(
        JSON.stringify({
          error: "Did you mean",
          suggestion: validationResult.substring(11).trim(),
          isValid: false
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Only proceed with analysis for valid professions
    if (!validationResult.startsWith("VALID:")) {
      return new Response(
        JSON.stringify({
          error: "Invalid response from validator",
          isValid: false
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const profession = validationResult.substring(6).trim();

    // Step 2: Get profession analysis
    const analysisResponse = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a profession analyzer. For the profession, provide:
1. Common workplace issues (list 3-5)
2. Recommended exercises during work hours (list 3-5)
3. Exercise frequency
4. Physical demands
5. Workplace environment

Format as JSON:
{
  "workplace_issues": [{"issue": "string", "severity": "high|medium|low"}],
  "exercises": [{"name": "string", "description": "string", "duration": "string", "frequency": "string"}],
  "physical_demands": ["string"],
  "environment": "active|sedentary",
  "category": "string"
}`
          },
          {
            role: "user",
            content: `Analyze the profession: ${profession}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    const analysisData = await analysisResponse.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    return new Response(
      JSON.stringify({
        profession: {
          name: profession,
          validated: true,
          ...analysis
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze profession",
        details: error.message,
        isValid: false
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Keep this version that includes content analysis
function determineCategory(profession: string, content: string): string {
  const categories = {
    healthcare: ['doctor', 'nurse', 'medical', 'healthcare', 'hospital'],
    office: ['desk', 'office', 'computer', 'administrative'],
    service: ['retail', 'cashier', 'customer', 'service'],
    manual: ['construction', 'labor', 'physical', 'manufacturing'],
    education: ['teacher', 'professor', 'instructor', 'education']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => 
      profession.toLowerCase().includes(k) || 
      content.toLowerCase().includes(k)
    )) {
      return category;
    }
  }
  return 'other';
}

function extractPhysicalDemands(content: string): string[] {
  const demands = content.match(/(?:requires|involving|includes|demands?).*?(?:standing|sitting|lifting|walking|carrying|moving)/gi) || [];
  return [...new Set(demands.map(d => d.toLowerCase()))].slice(0, 3);
}

function extractWorkplaceCharacteristics(content: string): string[] {
  const characteristics = [];
  if (content.toLowerCase().includes('indoor')) characteristics.push('indoor');
  if (content.toLowerCase().includes('outdoor')) characteristics.push('outdoor');
  if (content.toLowerCase().includes('active') || content.toLowerCase().includes('moving')) {
    characteristics.push('active');
  } else {
    characteristics.push('sedentary');
  }
  if (content.toLowerCase().includes('fast-paced')) characteristics.push('fast-paced');
  return characteristics.slice(0, 3);
}

function extractMovements(content: string): string[] {
  const movements = content.match(/(?:walking|standing|sitting|bending|reaching|lifting)/gi) || [];
  return [...new Set(movements.map(m => m.toLowerCase()))].slice(0, 3);
}

function extractHealthRisks(content: string): string[] {
  const risks = content.match(/(?:risk|pain|strain|stress|fatigue|injury).*?(?:\.|,|\n)/gi) || [];
  return [...new Set(risks.map(r => r.toLowerCase()))].slice(0, 3);
}

function extractExerciseTypes(content: string): string[] {
  const exercises = content.match(/(?:exercise|training|stretch|strengthen).*?(?:\.|,|\n)/gi) || [];
  return [...new Set(exercises.map(e => e.toLowerCase()))].slice(0, 3);
}

function extractFrequency(content: string): string {
  const frequency = content.match(/every (\d+)(?:-\d+)? hours?/i)?.[0] || 
                   content.match(/(\d+) times? (?:per|a) day/i)?.[0] ||
                   "every 2-3 hours";
  return frequency;
}

function extractFocusAreas(content: string): string[] {
  const areas = content.match(/(?:back|neck|shoulders|legs|arms|core|wrists)/gi) || [];
  return [...new Set(areas.map(a => a.toLowerCase()))].slice(0, 3);
}

function extractCommonIssues(content: string): Array<{issue: string; severity: string}> {
  const issues = content.match(/(?:risk|pain|strain|stress|fatigue|injury).*?(?:\.|,|\n)/gi) || [];
  return [...new Set(issues.map(i => i.toLowerCase()))]
    .slice(0, 3)
    .map(issue => ({
      issue,
      severity: issue.includes('severe') || issue.includes('high') ? 'high' : 'medium'
    }));
}

// Helper function with fallback values
function ensureValidArray(value: any, fallback: string[]): string[] {
  if (Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string')) {
    return value.map(item => item.toLowerCase());
  }
  return fallback;
} 