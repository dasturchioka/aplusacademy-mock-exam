import { useEffect, useState } from "react";
import { defaultInstance as axios } from "@/http";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

function WritingTaskAIEvaluation({
  label,
  taskType,
  text,
  onScore,
  onBothDone,
}: {
  label: string;
  taskType: "task1" | "task2";
  text: string;
  onScore: (band: number) => void;
  onBothDone: (t1: string, t2: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [revision, setRevision] = useState<string>("");
  const [revEval, setRevEval] = useState<any>(null);

  const wordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  useEffect(() => {
    if (!text?.trim()) return;
    setRevision(text);
    (async () => {
      try {
        setLoading(true);
        const res = await axios.post("/api/writing/evaluate", {
          text,
          taskType,
        });
        if (!res.data?.success)
          throw new Error(res.data?.error || "Failed to evaluate");
        const ev = res.data.evaluation;
        setEvaluation(ev);
        const band = Number(ev?.overallScore) || 0;
        onScore(band);
      } catch (e: any) {
        setError(e.message || "Failed to evaluate essay");
      } finally {
        setLoading(false);
      }
    })();
  }, [text, taskType]);

  // notify when both are available by checking current URL state of task1Score/task2Score via event
  useEffect(() => {
    if (!evaluation) return;
    const t1 = (
      document.querySelector(
        'input[placeholder="0.0"][value]'
      ) as HTMLInputElement
    )?.value; // not reliable; left as noop
    // Instead emit a custom event asking parent to recompute; but parent is already recomputing upon each onScore via onBothDone on sibling call
  }, [evaluation]);

  const annotate = (
    txt: string,
    highlights: Array<{
      type: string;
      text?: string;
      excerpt?: string;
      suggestion: string;
    }>
  ) => {
    try {
      let annotated = txt;
      highlights?.forEach((h) => {
        const frag = h.text || h.excerpt;
        if (!frag) return;
        const safe = frag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(safe, "i");
        annotated = annotated.replace(
          re,
          (m) => `[[[HL:${h.type}]]]${m}[[[/HL]]]`
        );
      });
      const parts = annotated.split(
        /\[\[\[(HL:(?:grammar|coherence|vocabulary))\]\]\]|\[\[\[\/HL\]\]\]/
      );
      const chunks: any[] = [];
      let currentType: string | null = null;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (part?.startsWith("HL:")) {
          currentType = part.substring(3);
          continue;
        }
        if (currentType) {
          const color =
            currentType === "grammar"
              ? "#fee2e2"
              : currentType === "coherence"
              ? "#fef9c3"
              : "#dbeafe";
          const suggestion = (
            highlights.find(
              (h) =>
                (h.text || h.excerpt) &&
                new RegExp(
                  (h.text || h.excerpt)!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  "i"
                ).test(part)
            ) || { suggestion: "" }
          ).suggestion;
          chunks.push(
            <mark
              key={i}
              className="px-0.5 rounded text-highlight"
              title={suggestion}
              style={{ backgroundColor: color }}
            >
              {part}
            </mark>
          );
          currentType = null;
        } else {
          chunks.push(<span key={i}>{part}</span>);
        }
      }
      return chunks;
    } catch {
      return txt;
    }
  };

  const evaluateRevision = async () => {
    try {
      setRevEval(null);
      const res = await axios.post("/api/writing/evaluate", {
        text: revision,
        taskType,
      });
      if (!res.data?.success)
        throw new Error(res.data?.error || "Failed to evaluate");
      const ev = res.data.evaluation;
      setRevEval(ev);
      const band = Number(ev?.overallScore) || 0;
      onScore(band);
    } catch (e: any) {
      setError(e.message || "Failed to evaluate revision");
    }
  };

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="text-sm text-gray-500">Evaluating...</div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {evaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-3xl font-bold">
                    {evaluation.overallScore}
                  </div>
                  <div className="text-gray-500">Overall</div>
                </div>
                <div>
                  <div className="font-medium">Task Achievement</div>
                  <div>{evaluation.criteria?.taskAchievement}</div>
                </div>
                <div>
                  <div className="font-medium">Coherence & Cohesion</div>
                  <div>
                    {evaluation.criteria?.coherenceAndCohesion ??
                      evaluation.criteria?.coherenceCohesion}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Lexical / Grammar</div>
                  <div>
                    {evaluation.criteria?.lexicalResource} /{" "}
                    {evaluation.criteria?.grammaticalRangeAndAccuracy}
                  </div>
                </div>
              </div>

              <div className="prose max-w-none leading-7">
                {annotate(text, evaluation.highlights || [])}
              </div>

              <div className="text-sm text-gray-600">
                <strong>Summary:</strong> {evaluation.summary}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <strong>Words</strong>
                  <div>{wordCount(text)}</div>
                </div>
                <div>
                  <strong>Unique</strong>
                  <div>{evaluation.statistics?.uniqueWordCount}</div>
                </div>
                <div>
                  <strong>Overused</strong>
                  <div>
                    {(evaluation.statistics?.overusedWords || []).join(", ") ||
                      "-"}
                  </div>
                </div>
                <div>
                  <strong>Relevance</strong>
                  <div>
                    {evaluation.statistics?.topicRelevance ??
                      evaluation.statistics?.topicRelevancePercentage}
                    %
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Revise and compare</div>
                <Textarea
                  className="min-h-[160px]"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={evaluateRevision}>Evaluate Revision</Button>
                </div>
                {revEval && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">Before</div>
                      <div className="text-2xl font-bold">
                        {evaluation?.overallScore}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium mb-1">After</div>
                      <div className="text-2xl font-bold">
                        {revEval?.overallScore}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WritingTaskAIEvaluation;
