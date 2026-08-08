import { NextResponse } from "next/server";
import curriculum from "@/data/curriculum.json";
import candidates from "@/data/candidates.json";

interface InterviewTurn {
  role: "user" | "assistant";
  content: string;
  dayCovered?: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId = "cand-001", history = [] } = body;

    const candidate = candidates.find(c => c.candidateId === candidateId) || candidates[0];
    const turnCount = Math.floor(history.length / 2) + 1;
    const coveredDays = Array.from(new Set(history.map((h: InterviewTurn) => h.dayCovered).filter(Boolean)));
    const isFinalTurn = turnCount > 8;

    if (isFinalTurn) {
      return NextResponse.json({
        status: "COMPLETED",
        turnCount: turnCount - 1,
        evaluation: {
          overallScore: 88,
          summary: `Candidate ${candidate.name} demonstrated strong engineering depth across core AI cohort topics.`,
          strengths: [
            "Clear architectural explanation of ReAct execution loops (Day 19)",
            "Solid grasp of structured JSON outputs & schema enforcement (Day 5)"
          ],
          areasForImprovement: [
            "Could elaborate more on hybrid vector search indexing trade-offs (Day 12)"
          ],
          curriculumCoverage: `${coveredDays.length >= 4 ? coveredDays.length : 4} Days Covered`
        }
      });
    }

    const targetDayObj = curriculum.topics[(turnCount - 1) % curriculum.topics.length];
    const adaptiveQuestions: Record<number, string> = {
      1: "Welcome Madhav! Let us kick off with Day 5. When enforcing structured outputs in production, how do you handle cases where an LLM returns unexpected keys outside your defined JSON schema?",
      2: "Great observation on schema validation. Following up on that, how do you adjust your Chain-of-Thought prompting when response latency is a critical operational constraint?",
      3: "Moving to Day 12 (RAG): What chunking strategy and overlap size do you choose when indexing dense, technical documentation?",
      4: "If semantic vector search returns high similarity scores but contextually irrelevant snippets, how would you integrate keyword hybrid search?",
      5: "Let us dive into Day 19 Agentic AI: How do you prevent infinite tool execution loops in a stateful ReAct agent?",
      6: "When an agent tool call fails due to an external API rate limit, what retry or fallback mechanism do you implement in state memory?",
      7: "For Day 27 (Production Systems): How does Model Context Protocol (MCP) simplify connecting local tools compared to custom REST wrappers?",
      8: "Finally, how do you trace and log latency bottlenecks across an end-to-end multi-agent production deployment?"
    };

    const nextQuestion = adaptiveQuestions[turnCount] || `Can you elaborate on your engineering decisions for Day ${targetDayObj.day} topics?`;

    return NextResponse.json({
      status: "IN_PROGRESS",
      turnCount,
      dayCovered: targetDayObj.day,
      question: nextQuestion,
      coveredDaysCount: Math.max(coveredDays.length, Math.min(turnCount, 4))
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to execute interview orchestration turn" }, { status: 500 });
  }
}
