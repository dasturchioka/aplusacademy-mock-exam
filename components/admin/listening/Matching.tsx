"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash, Trash2, Plus } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Switch } from "@/components/ui/switch";

interface Pair {
  item: string;
  match: string;
  number: string;
  isInteractive: boolean;
}

interface Option {
  text: string;
  label: string;
  variant?: string;
}

// Updated to match all-tests.json structure exactly
interface MatchingBlock {
  id: string;
  type: string;
  questionStart: number | string;
  questionEnd: number | string;
  instructions: string[];
  headline?: string;
  answerConstraints: string;
  isInteractive: boolean;
  pairs: Pair[];
  options: Option[];
  optionsHeadline?: string;
  questions: any[]; // Should be empty for matching types
  optionsAtATime?: string | number;
}

interface Props {
  data: MatchingBlock;
  onChange: (updatedData: MatchingBlock) => void;
}

export default function MatchingAdmin({ data, onChange }: Props) {
  const [form, setForm] = useState<MatchingBlock>(data);
  const isSyncingRef = useRef(false);

  // Sync form with incoming data prop (for edit mode)
  useEffect(() => {
    isSyncingRef.current = true;
    setForm(data);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [data]);

  // 🚀 Auto-renumber pairs when questionStart changes or isInteractive changes
  useEffect(() => {
    const startNum =
      typeof form.questionStart === "number"
        ? form.questionStart
        : parseInt(form.questionStart as string) || 1;

    // Get only interactive pairs for numbering
    let currentQuestionNumber = startNum;
    const needsRenumbering = form.pairs.some((pair, idx) => {
      if (pair.isInteractive) {
        const shouldBe = currentQuestionNumber.toString();
        currentQuestionNumber++;
        return pair.number !== shouldBe;
      }
      return false;
    });

    if (needsRenumbering) {
      let questionNumber = startNum;
      const renumberedPairs = form.pairs.map((pair) => {
        if (pair.isInteractive) {
          const newNumber = questionNumber.toString();
          questionNumber++;
          return { ...pair, number: newNumber };
        }
        return { ...pair, number: "" };
      });

      console.log("🔢 Auto-renumbering Matching pairs:", {
        questionStart: startNum,
        interactivePairs: renumberedPairs.filter((p) => p.isInteractive).length,
        newNumbers: renumberedPairs
          .filter((p) => p.isInteractive)
          .map((p) => p.number),
      });

      setForm((prev) => ({ ...prev, pairs: renumberedPairs }));
    }
  }, [form.questionStart, form.pairs.map((p) => p.isInteractive).join(",")]);

  // 🚀 Auto-update questionEnd based on interactive pairs
  useEffect(() => {
    const interactivePairsCount = form.pairs.filter(
      (p) => p.isInteractive
    ).length;
    if (interactivePairsCount > 0) {
      const startNum =
        typeof form.questionStart === "number"
          ? form.questionStart
          : parseInt(form.questionStart as string) || 1;
      const expectedEnd = startNum + interactivePairsCount - 1;

      if (form.questionEnd !== expectedEnd) {
        console.log("🔢 Auto-updating questionEnd:", {
          oldEnd: form.questionEnd,
          newEnd: expectedEnd,
          interactivePairs: interactivePairsCount,
        });

        setForm((prev) => ({ ...prev, questionEnd: expectedEnd }));
      }
    }
  }, [form.pairs.filter((p) => p.isInteractive).length, form.questionStart]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onChange(form);
    }
  }, [form]);

  // 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("🔗 Matching Component Updated:", {
        type: form.type,
        questionRange: `${form.questionStart}-${form.questionEnd}`,
        pairsCount: form.pairs.length,
        optionsCount: form.options.length,
        interactivePairs: form.pairs.filter((p) => p.isInteractive).length,
        fullStructure: form,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [form]);

  const updateField = useCallback(
    <K extends keyof MatchingBlock>(key: K, value: MatchingBlock[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const removeInstruction = useCallback((idx: number) => {
    setForm((prev) => {
      const updated = [...prev.instructions];
      updated.splice(idx, 1);
      return { ...prev, instructions: updated };
    });
  }, []);

  const updatePair = useCallback(
    (index: number, key: keyof Pair, value: string | boolean | number) => {
      setForm((prev) => {
        const updatedPairs = [...prev.pairs];
        updatedPairs[index] = { ...updatedPairs[index], [key]: value };
        return { ...prev, pairs: updatedPairs };
      });
    },
    []
  );

  const removePair = useCallback((index: number) => {
    setForm((prev) => {
      const removedPair = prev.pairs[index];
      const updated = [...prev.pairs];
      updated.splice(index, 1);

      // 🚀 REAL-TIME PAIR REMOVAL LOGGING
      console.log("❌ Removed pair from Matching:", {
        removedIndex: index,
        removedPairNumber: removedPair.number,
        removedPairItem: removedPair.item,
        remainingPairs: updated.length,
        removedPair: removedPair,
      });

      return { ...prev, pairs: updated };
    });
  }, []);

  const addPair = useCallback(() => {
    setForm((prev) => {
      const startNum =
        typeof prev.questionStart === "number"
          ? prev.questionStart
          : parseInt(prev.questionStart as string) || 1;

      // Count only interactive pairs to get next question number
      const interactivePairsCount = prev.pairs.filter(
        (p) => p.isInteractive
      ).length;
      const nextNumber = (startNum + interactivePairsCount).toString();

      const newPair = {
        item: "",
        match: "", // Empty string as requested
        number: nextNumber,
        isInteractive: true,
      };

      // 🚀 REAL-TIME PAIR ADDITION LOGGING
      console.log("➕ Added pair to Matching:", {
        newPairNumber: nextNumber,
        totalPairs: prev.pairs.length + 1,
        interactivePairsCount: interactivePairsCount + 1,
        addedPair: newPair,
      });

      return { ...prev, pairs: [...prev.pairs, newPair] };
    });
  }, []);

  const updateOption = useCallback(
    (index: number, key: keyof Option, value: string) => {
      setForm((prev) => {
        const updatedOptions = [...prev.options];
        updatedOptions[index] = { ...updatedOptions[index], [key]: value };
        return { ...prev, options: updatedOptions };
      });
    },
    []
  );

  const removeOption = useCallback((index: number) => {
    setForm((prev) => {
      const updated = [...prev.options];
      updated.splice(index, 1);
      return { ...prev, options: updated };
    });
  }, []);

  const addOption = useCallback(() => {
    setForm((prev) => {
      const label = String.fromCharCode(65 + prev.options.length);
      return {
        ...prev,
        options: [
          ...prev.options,
          {
            text: "",
            label,
            variant: label,
          },
        ],
      };
    });
  }, []);

  return (
    <Card className="space-y-4 p-4">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Question Start</Label>
            <Input
              value={form.questionStart}
              onChange={(e) => updateField("questionStart", e.target.value)}
            />
          </div>
          <div>
            <Label>Question End</Label>
            <Input
              value={form.questionEnd}
              onChange={(e) => updateField("questionEnd", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Headline</Label>
          <Input
            value={form.headline || ""}
            onChange={(e) => updateField("headline", e.target.value)}
            placeholder="Question block headline"
          />
        </div>

        <div>
          <Label>Instructions</Label>
          {form.instructions.map((text, idx) => (
            <div key={idx} className="relative">
              <Input
                className="mb-2"
                value={text}
                onChange={(e) => {
                  const updated = [...form.instructions];
                  updated[idx] = e.target.value;
                  updateField("instructions", updated);
                }}
              />
              <Button
                className="absolute top-0 right-0"
                onClick={() => removeInstruction(idx)}
                variant={"ghost"}
              >
                <Trash />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            className="mt-1"
            onClick={() =>
              updateField("instructions", [...form.instructions, ""])
            }
          >
            Add Instruction
          </Button>
        </div>

        <div>
          <Label>Answer Constraints</Label>
          <Textarea
            value={form.answerConstraints}
            onChange={(e) => updateField("answerConstraints", e.target.value)}
          />
        </div>

        {/* ✅ New field for optionsAtATime */}
        <div>
          <Label>Options At A Time</Label>
          <Input
            type="number"
            min={1}
            value={form.optionsAtATime || 1}
            onChange={(e) =>
              updateField("optionsAtATime", Number(e.target.value))
            }
          />
        </div>

        {/* Matching Pairs */}
        <div className="space-y-2">
          <Label>Matching Items</Label>
          {form.pairs.map((pair, idx) => (
            <div key={idx} className="border p-3 rounded space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Item {idx + 1}</Label>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePair(idx)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">
                    Number{" "}
                    {pair.isInteractive && (
                      <span className="text-muted-foreground">(auto)</span>
                    )}
                  </Label>
                  <Input
                    value={pair.number || ""}
                    onChange={(e) => updatePair(idx, "number", e.target.value)}
                    placeholder="Auto"
                    className={!pair.isInteractive ? "bg-muted" : ""}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pair.isInteractive}
                    onCheckedChange={(checked) =>
                      updatePair(idx, "isInteractive", checked)
                    }
                  />
                  <Label className="text-xs">Interactive</Label>
                </div>
              </div>

              <div>
                <Label className="text-xs">Item Text</Label>
                <Textarea
                  value={pair.item}
                  onChange={(e) => updatePair(idx, "item", e.target.value)}
                  placeholder="Enter item text here..."
                  rows={2}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addPair}>
            <Plus className="w-4 h-4 mr-2" />
            Add Matching Item
          </Button>
        </div>

        {/* Answer Options */}
        <div className="space-y-2">
          <div className="options-headline">
            <Label>Options headline</Label>
            <Input
              value={form.optionsHeadline}
              placeholder="List of something"
              onChange={(e) => updateField("optionsHeadline", e.target.value)}
            />
          </div>
          <Label>Answer Options</Label>
          {form.options.map((opt, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[80px_1fr_40px] gap-2 items-center"
            >
              <Input
                value={opt.label}
                placeholder="A"
                onChange={(e) => updateOption(idx, "label", e.target.value)}
              />
              <Input
                value={opt.text}
                placeholder="Option text"
                onChange={(e) => updateOption(idx, "text", e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeOption(idx)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addOption}>
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
