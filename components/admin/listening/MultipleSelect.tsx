"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type Choice = {
  variant: string;
  text: string;
};

// Updated to match all-tests.json structure exactly
interface MultipleSelectBlock {
  id: string;
  type: "multiple-select";
  questionStart: number | string;
  questionEnd: number | string;
  instructions: string[];
  headline?: string;
  questionId: string;
  questionText: string;
  choices: Choice[];
}

type Props = {
  data: MultipleSelectBlock;
  onChange: (updatedData: MultipleSelectBlock) => void;
};

export default function MultipleSelectAdmin({ data, onChange }: Props) {
  const [form, setForm] = useState<MultipleSelectBlock>(data);
  const isSyncingRef = useRef(false);

  // Sync form with incoming data prop (for edit mode)
  useEffect(() => {
    isSyncingRef.current = true;
    setForm(data);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [data]);

  useEffect(() => {
    if (!isSyncingRef.current) {
      onChange(form);
    }
  }, [form]);

  // 🚀 REAL-TIME COMPONENT LOGGING (Separate useEffect to prevent infinite loops)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("📊 MultipleSelect Component Updated:", {
        type: form.type,
        questionRange: `${form.questionStart}-${form.questionEnd}`,
        choicesCount: form.choices?.length || 0,
        questionText: form.questionText || "",
        fullStructure: form,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [form]);

  const updateField = <K extends keyof MultipleSelectBlock>(
    key: K,
    value: MultipleSelectBlock[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateChoice = (index: number, field: keyof Choice, value: string) => {
    const updatedChoices = [...form.choices];
    updatedChoices[index] = { ...updatedChoices[index], [field]: value };
    updateField("choices", updatedChoices);
  };

  const removeChoice = (index: number) => {
    const updatedChoices = [...form.choices];
    updatedChoices.splice(index, 1);
    updateField("choices", updatedChoices);
  };

  const addChoice = () => {
    const nextLetter = String.fromCharCode(65 + form.choices.length);
    updateField("choices", [
      ...form.choices,
      { variant: nextLetter, text: "" },
    ]);
  };

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
          <Label>Question Text</Label>
          <Textarea
            value={form.questionText || ""}
            onChange={(e) => updateField("questionText", e.target.value)}
          />
        </div>

        <div>
          <Label>Instructions</Label>
          {form.instructions.map((inst, idx) => (
            <Input
              key={idx}
              value={inst}
              className="mb-2"
              onChange={(e) => {
                const updated = [...form.instructions];
                updated[idx] = e.target.value;
                updateField("instructions", updated);
              }}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateField("instructions", [...form.instructions, ""]);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Instruction
          </Button>
        </div>

        <div className="space-y-4">
          <Label>Choices</Label>
          {form?.choices?.map((choice, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[60px_1fr_40px] items-center gap-2"
            >
              <Input
                placeholder="Variant"
                value={choice.variant}
                onChange={(e) => updateChoice(idx, "variant", e.target.value)}
              />
              <Input
                placeholder="Text"
                value={choice.text}
                onChange={(e) => updateChoice(idx, "text", e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeChoice(idx)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button onClick={addChoice} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Choice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
