import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import curriculum from "@/data/curriculum.json";
import candidates from "@/data/candidates.json";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface InterviewTurn {
  role: "user" | "assistant";
  content: string;
  dayCovered?: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId = "cand-001", history = [] } = body;

    const candidate = candidates.find((c: any) => c.candidateId === candidateId) || candidates[0];
    const turnCount = Math.floor(history.length / 2) + 1;
    const coveredDays = Array.from(new Set(history.map((h: InterviewTurn) => h.dayCovered).filter(Boolean)));
    const isFinalTurn = turnCount > 8;

    // ==========================================
    // DYNAMIC EVALUATION ENGINE (TURN 9)
    // ==========================================
    if (isFinalTurn) {
      const transcript = history.map((h: InterviewTurn) => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n');

      const evaluationPrompt = `You are an expert technical interviewer evaluating a candidate.
Candidate Name: ${candidate.name}
Target Role: AI Product Engineer

Interview Transcript:
${transcript}

Task: Rigorously evaluate the candidate's responses based on technical accuracy. 
- If their answers are short, incorrect, or nonsensical (e.g., just typing random words), give them a LOW overall score (0-40).
- If their answers are deeply technical and accurate, give them a HIGH overall score (80-100).
- Be brutally honest in the summary and areas for improvement based ONLY on what they typed in the transcript.

You MUST return a valid JSON object strictly matching this format:
{
  "overallScore": <number between 0 and 100>,
  "summary": "<A strict 2-sentence summary of their actual performance>",
  "strengths": ["<Specific strength based on transcript>", "<Another strength>"],
  "areasForImprovement": ["<Specific weakness based on transcript>", "<Another weakness>"],
  "curriculumCoverage": "${coveredDays.length >= 4 ? coveredDays.length : 4} Days Covered"
}`;

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: evaluationPrompt }],
        temperature: 0.1, // Low temp for strict grading
      });

      const evaluationJson = JSON.parse(response.choices[0]?.message?.content || '{}');

      return NextResponse.json({
        status: "COMPLETED",
        turnCount: turnCount - 1,
        evaluation: evaluationJson
      });
    }

    // ==========================================
    // DYNAMIC QUESTION ENGINE (TURNS 1-8)
    // ==========================================
    let dayCovered = 5;
    let questionType = 'concept';

    if (turnCount <= 2) { dayCovered = 5; questionType = turnCount === 1 ? 'concept' : 'follow_up'; }
    else if (turnCount <= 4) { dayCovered = 12; questionType = turnCount === 3 ? 'concept' : 'follow_up'; }
    else if (turnCount <= 6) { dayCovered = 19; questionType = turnCount === 5 ? 'concept' : 'follow_up'; }
    else { dayCovered = 27; questionType = turnCount === 7 ? 'concept' : 'follow_up'; }

    const topicObj = curriculum.topics.find((t: any) => t.day === dayCovered) || curriculum.topics[0];
    const conversationTranscript = history.map((h: InterviewTurn) => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n');

    const questionPromptSystem = `You are a senior AI engineering interviewer conducting a realistic technical interview.
Candidate: ${candidate.name}
Topic: ${topicObj.topic}
Objectives: ${topicObj.learning_objectives.join(', ')}

Strict Rules:
1. Ask ONE concise technical question (1-3 sentences max).
2. Do NOT say "Great answer" or give feedback. Just ask the question naturally.
3. Output ONLY the question text. No quotes, no markdown headers.`;

    const userMessage = questionType === 'concept'
      ? `Generate an introductory technical question for Day ${dayCovered} (${topicObj.topic}) based on the objectives.`
      : `Look at the conversation transcript below. Generate an adaptive, conversational follow-up question for Day ${dayCovered} (${topicObj.topic}) that specifically probes their last answer. Challenge them if they were vague.
Transcript:
${conversationTranscript}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: questionPromptSystem },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    const nextQuestion = response.choices[0]?.message?.content?.trim() || `Can you elaborate on your engineering decisions for Day ${dayCovered}?`;

    return NextResponse.json({
      status: "IN_PROGRESS",
      turnCount,
      dayCovered: dayCovered,
      question: nextQuestion,
      coveredDaysCount: Math.max(coveredDays.length, Math.min(turnCount, 4))
    });

  } catch (error: any) {
    console.error("Orchestration error:", error);
    return NextResponse.json({ error: "Failed to execute interview orchestration turn" }, { status: 500 });
  }
}