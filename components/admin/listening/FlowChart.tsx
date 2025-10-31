"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle } from "lucide-react";
import {
  FlowChartNode,
  FlowChartQuestionBlock,
} from "@/components/exam/listening/FlowChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FlowChartAdmin({
  question,
  onChange,
}: {
  question: FlowChartQuestionBlock;
  onChange: (updated: FlowChartQuestionBlock) => void;
}) {
  const [data, setData] = useState(question);
  const isSyncingRef = useRef(false);

  // Sync data with incoming question prop (for edit mode)
  useEffect(() => {
    isSyncingRef.current = true;
    setData(question);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [question]);

  const update = useCallback(
    (newData: typeof data) => {
      setData(newData);
      if (!isSyncingRef.current) {
        onChange(newData);
      }
    },
    [onChange]
  );

  const addNode = () => {
    const newNode: FlowChartNode = {
      id: crypto.randomUUID(),
      text: "",
      isInteractive: true,
      questionNumber: 0,
      position: "bottom",
      interactionType: "input",
      isMultiple: false,
      questionStart: undefined,
      questionEnd: undefined,
    };
    update({
      ...data,
      nodes: [...data.nodes, newNode],
    });
  };

  const deleteNode = (id: string) => {
    update({
      ...data,
      nodes: data.nodes.filter((n) => n.id !== id),
    });
  };

  const updateNode = useCallback(
    (id: string, updatedFields: Partial<FlowChartNode>) => {
      setData((prev) => {
        const updatedNodes = prev.nodes.map((n) =>
          n.id === id ? { ...n, ...updatedFields } : n
        );
        const newData = {
          ...prev,
          nodes: updatedNodes,
        };
        onChange(newData);
        return newData;
      });
    },
    [onChange]
  );

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...data.instructions];
    updatedInstructions[index] = value;
    update({ ...data, instructions: updatedInstructions });
  };

  const addInstruction = () => {
    update({ ...data, instructions: [...data.instructions, ""] });
  };

  const deleteInstruction = (index: number) => {
    const updatedInstructions = [...data.instructions];
    updatedInstructions.splice(index, 1);
    update({ ...data, instructions: updatedInstructions });
  };

  const addOption = () => {
    const newOptions = [
      ...(data.matchingOptions || []),
      { label: "", text: "" },
    ];
    update({ ...data, matchingOptions: newOptions });
  };

  const updateOption = (
    optionIndex: number,
    field: "label" | "text",
    value: string
  ) => {
    const updatedOptions = [...(data.matchingOptions || [])];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value,
    };
    update({ ...data, matchingOptions: updatedOptions });
  };

  const deleteOption = (optionIndex: number) => {
    const updatedOptions = [...(data.matchingOptions || [])];
    updatedOptions.splice(optionIndex, 1);
    update({ ...data, matchingOptions: updatedOptions });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Flow Chart (Admin)</h2>

      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          value={data.headline || ""}
          onChange={(e) => update({ ...data, headline: e.target.value })}
          placeholder="Question block headline"
        />
      </div>

      <div className="space-y-2">
        <Label>Instructions</Label>
        {data.instructions.map((inst, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={inst}
              onChange={(e) => updateInstruction(i, e.target.value)}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteInstruction(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={addInstruction}
          className="flex gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Add Instruction
        </Button>
      </div>

      <div className="flex gap-4">
        <div>
          <Label>Question Start</Label>
          <Input
            type="number"
            value={data.questionStart}
            onChange={(e) =>
              update({
                ...data,
                questionStart: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label>Question End</Label>
          <Input
            type="number"
            value={data.questionEnd}
            onChange={(e) =>
              update({
                ...data,
                questionEnd: parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Global Matching Options Section */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">
            Matching Options (Shared across all matching questions)
          </Label>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Max uses per option:</Label>
            <Input
              type="number"
              className="w-20 h-8"
              min="1"
              value={data.optionsAtATime || 1}
              onChange={(e) =>
                update({
                  ...data,
                  optionsAtATime: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
          <div className="options-headline">
            <Label>Options headline</Label>
            <Input
              value={data.optionsHeadline}
              placeholder="List of something"
              onChange={(e) =>
                update({
                  ...data,
                  optionsHeadline: e.target.value,
                })
              }
            />
          </div>
          {(data.matchingOptions || []).map((option, optionIdx) => (
            <div key={optionIdx} className="flex gap-2 items-center">
              <Input
                placeholder="Label (A, B, C...)"
                className="w-24"
                value={option.label}
                onChange={(e) =>
                  updateOption(optionIdx, "label", e.target.value)
                }
              />
              <Input
                placeholder="Display text"
                className="flex-1"
                value={option.text}
                onChange={(e) =>
                  updateOption(optionIdx, "text", e.target.value)
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteOption(optionIdx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => addOption()}
            className="flex gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Option
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Flow Chart Boxes</Label>
        {data.nodes.map((node) => (
          <div
            key={node.id}
            className="border p-4 rounded-xl space-y-4 relative"
          >
            <div className="flex items-center gap-2">
              <Switch
                checked={node.isInteractive}
                onCheckedChange={(val) =>
                  updateNode(node.id, { isInteractive: val })
                }
              />
              <span>Is Interactive?</span>
            </div>

            {node.isInteractive && (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!node.isMultiple}
                    onCheckedChange={(val) =>
                      updateNode(node.id, { isMultiple: val })
                    }
                  />
                  <span>Multiple Questions?</span>
                </div>

                {node.isMultiple ? (
                  <div className="flex gap-4">
                    <div>
                      <Label>Question Start</Label>
                      <Input
                        type="number"
                        value={node.questionStart || ""}
                        onChange={(e) =>
                          updateNode(node.id, {
                            questionStart: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Question End</Label>
                      <Input
                        type="number"
                        value={node.questionEnd || ""}
                        onChange={(e) =>
                          updateNode(node.id, {
                            questionEnd: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={node.questionNumber || ""}
                    onChange={(e) =>
                      updateNode(node.id, {
                        questionNumber: parseInt(e.target.value),
                      })
                    }
                  />
                )}

                <div className="flex items-center gap-2">
                  <Label>Type:</Label>
                  <Select
                    value={node.interactionType || "input"}
                    onValueChange={(value: "input" | "matching") =>
                      updateNode(node.id, { interactionType: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="input">Input</SelectItem>
                      <SelectItem value="matching">Matching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Textarea
              value={node.text}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
            />

            <Button
              size="icon"
              className="absolute top-2 right-2"
              variant="ghost"
              onClick={() => deleteNode(node.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button onClick={addNode} className="flex gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Box
        </Button>
      </div>
    </div>
  );
}
