"use client";

import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageState } from "@/components/ui/page-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { buildMediaUrl, defaultInstance as axios } from "@/http/index";
import { notify } from "@/lib/app-toast";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Import the new questionId utilities (temporary comment out until file is created)

// Import admin components
import DiagramLabellingAdmin from "@/components/admin/listening/DiagramLabelling";
import FlowChartAdmin from "@/components/admin/listening/FlowChart";
import FormCompletionAdmin from "@/components/admin/listening/FormCompletion";
import { MapLabellingAdmin } from "@/components/admin/listening/MapLabelling";
import MatchingAdmin from "@/components/admin/listening/Matching";
import MultipleChoiceAdmin from "@/components/admin/listening/MultipleChoice";
import MultipleSelectAdmin from "@/components/admin/listening/MultipleSelect";
import TableCompletionAdmin from "@/components/admin/listening/TableCompletion";
import MultipleSelectAdminReading from "@/components/admin/reading/MultipleSelect";

import SummaryCompletionAdmin from "@/components/admin/reading/SummaryCompletion";
import TrueFalseNotGivenAdmin from "@/components/admin/reading/TrueFalseNotGiven";
import YesNoNotGivenAdmin from "@/components/admin/reading/YesNoNotGiven";
import SummarySelectCompletionAdmin from "@/components/admin/reading/SummarySelectCompletion";
import MatchHeadingAdmin from "@/components/admin/reading/MatchHeading";
import CorrectAnswersManager from "@/components/admin/CorrectAnswersManager";

// Import component-specific types

// Generic question block type for our internal state
interface BaseQuestionBlock {
  id: string;
  type: string;
  questionStart: number | string;
  questionEnd: number | string;
  instructions: string[];
  answerConstraints?: string;
  isInteractive: boolean;
  inputType?: string;
  questions: any[];
  // Add additional properties that some question types use directly
  pairs?: any[];
  options?: any[];
  optionsAtATime?: string | number;
  // Type-specific properties
  headline?: string;
  rowHeaderName?: string;
  cols?: any[];
  rows?: any[];
  image?: any;
  labels?: string[];
  nodes?: any[];
  text?: string;
  answers?: any[];
  choices?: any[];
  questionId?: string;
}

// Types
type ListeningQuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "matching"
  | "form-completion"
  | "summary-completion"
  | "sentence-completion"
  | "short-answer"
  | "map-labelling"
  | "diagram-labelling"
  | "table-completion"
  | "flowchart-completion";

type ReadingQuestionType =
  | "matching-headers"
  | "match-heading"
  | "true-false-not-given"
  | "yes-no-not-given"
  | "matching-information"
  | "matching-features"
  | "matching-paragraphs"
  | "matching-sentence-endings"
  | "sentence-completion"
  | "summary-completion"
  | "note-completion"
  | "table-completion"
  | "flowchart-completion"
  | "diagram-label-completion"
  | "short-answer"
  | "multiple-choice"
  | "multiple-select"
  | "summary-select-completion";

interface ListeningPart {
  part: string;
  questionsRange: string;
  questionBlocks: BaseQuestionBlock[];
}

interface ReadingPassage {
  part: string;
  instructions: string;
  passage: {
    headline: string;
    subHeadline?: string;
    paragraphs: Array<{
      header: string;
      tag: string;
      content: string;
      droppableArea?: boolean;
      questionNumber?: number;
    }>;
  };
  questionStart: string;
  questionEnd: string;
  questionBlocks: BaseQuestionBlock[];
}

interface WritingTask {
  task: string;
  instructions: string[];
  image?: string;
}

interface TestData {
  id?: string;
  title: string;
  edition: string;
  testNumber: string;
  listening_audios: string[];
  author: string;
  listening: {
    parts: ListeningPart[];
  };
  reading: {
    passages: ReadingPassage[];
  };
  writing: {
    tasks: WritingTask[];
  };
  correct_answers: Array<{
    section: string;
    answers: Array<{
      number: number | number[];
      accepted: string[] | string[][];
      type?: "multi-select-pair";
    }>;
  }>
}

const LISTENING_QUESTION_TYPES: {
  value: ListeningQuestionType;
  label: string;
}[] = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "multiple-select", label: "Multiple Select" },
    { value: "matching", label: "Matching" },
    { value: "form-completion", label: "Form Completion" },
    { value: "summary-completion", label: "Summary Completion" },
    { value: "sentence-completion", label: "Sentence Completion" },
    { value: "short-answer", label: "Short Answer" },
    { value: "map-labelling", label: "Map Labelling" },
    { value: "diagram-labelling", label: "Diagram Labelling" },
    { value: "table-completion", label: "Table Completion" },
    { value: "flowchart-completion", label: "Flowchart Completion" },
  ];

const READING_QUESTION_TYPES: { value: ReadingQuestionType; label: string }[] =
  [
    { value: "matching-headers", label: "Matching Headers" },
    { value: "true-false-not-given", label: "True/False/Not Given" },
    { value: "yes-no-not-given", label: "Yes/No/Not Given" },
    { value: "matching-information", label: "Matching Information" },
    { value: "matching-paragraphs", label: "Matching Paragraphs" },
    { value: "matching-sentence-endings", label: "Matching Sentence Endings" },
    { value: "sentence-completion", label: "Sentence Completion" },
    { value: "summary-completion", label: "Summary Completion" },
    { value: "note-completion", label: "Note Completion" },
    { value: "table-completion", label: "Table Completion" },
    { value: "flowchart-completion", label: "Flowchart Completion" },
    { value: "diagram-label-completion", label: "Diagram Label Completion" },
    { value: "short-answer", label: "Short Answer" },
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "multiple-select", label: "Multiple Select" },
    { value: "summary-select-completion", label: "Summary Select Completion" },
  ];

// Draggable Question Block Component
interface DraggableQuestionBlockProps {
  block: BaseQuestionBlock;
  blockIndex: number;
  section: "listening" | "reading";
  partIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onMove: (dragInfo: {
    dragIndex: number;
    hoverIndex: number;
    dragPartIndex: number;
    hoverPartIndex: number;
  }) => void;
  onRemove: () => void;
  renderAdmin: () => React.ReactNode;
}

const DraggableQuestionBlock: React.FC<DraggableQuestionBlockProps> = ({
  block,
  blockIndex,
  section,
  partIndex,
  isOpen,
  onToggle,
  onMove,
  onRemove,
  renderAdmin,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: `QUESTION_BLOCK_${section}`,
    item: { blockIndex, section, partIndex, id: block.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: `QUESTION_BLOCK_${section}`,
    hover: (draggedItem: { blockIndex: number; section: string; partIndex: number; id: string }, monitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.blockIndex;
      const hoverIndex = blockIndex;
      const dragPartIndex = draggedItem.partIndex;
      const hoverPartIndex = partIndex;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && dragPartIndex === hoverPartIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the item's height
      if (dragPartIndex === hoverPartIndex) {
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      }

      // Perform the action
      onMove({
        dragIndex,
        hoverIndex,
        dragPartIndex,
        hoverPartIndex,
      });

      // Update the dragged item's indices
      draggedItem.blockIndex = hoverIndex;
      draggedItem.partIndex = hoverPartIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(dragHandleRef);
  drop(ref);

  return (
    <div
      ref={ref}
      className={`border rounded-lg relative transition-all ${isDragging ? "opacity-30 bg-gray-100" : "opacity-100"
        } ${isOver && canDrop ? "border-blue-500 bg-blue-50 border-2" : ""}`}
    >
      <Collapsible open={isOpen}>
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div
              ref={dragHandleRef}
              className="cursor-move p-1 hover:bg-gray-100 rounded"
              title="Drag to reorder or move to another section"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <StatusBadge status="neutral" label={block.type} />
            <StatusBadge
              status="info"
              label={`Q${block.questionStart}-${block.questionEnd}`}
            />
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <CollapsibleContent>
          <div className="p-4 pt-2">
            {renderAdmin()}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

async function uploadListeningAudio(
  file: File,
  testId: string | undefined,
  setError: (value: string) => void
) {
  if (!testId) {
    setError("Save the test before uploading audio.");
    return null;
  }

  const formData = new FormData();
  formData.append("audio", file);

  const res = await axios.post(`/api/tests/${testId}/listening/audio`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res;
}

async function deleteListeningAudio(
  testId: string | undefined,
  setError: (value: string) => void
) {
  if (!testId) {
    setError("Save the test before deleting audio.");
    return null;
  }

  const res = await axios.delete(`/api/tests/${testId}/listening/audio`);

  return res;
}

export default function CreateTestDynamic() {
  const searchParams = useSearchParams();
  const testId = searchParams?.get("id");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Section collapse states
  const [listeningOpen, setListeningOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [writingOpen, setWritingOpen] = useState(false);
  const [correctAnswersOpen, setCorrectAnswersOpen] = useState(false);

  // Individual part/passage collapse states
  const [listeningPartsOpen, setListeningPartsOpen] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": true,
    "4": true,
  });

  const [readingPassagesOpen, setReadingPassagesOpen] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": true,
  });

  const [listeningBlocksOpen, setListeningBlocksOpen] = useState<Record<string, boolean>>({});
  const [readingBlocksOpen, setReadingBlocksOpen] = useState<Record<string, boolean>>({});
  const [readingParagraphsOpen, setReadingParagraphsOpen] = useState<Record<string, boolean>>({});

  // Dialog states for question type selection
  const [questionTypeDialog, setQuestionTypeDialog] = useState<{
    open: boolean;
    section: "listening" | "reading";
    partIndex: number;
  }>({
    open: false,
    section: "listening",
    partIndex: 0,
  });

  const [testData, setTestData] = useState<TestData>({
    title: "",
    edition: "",
    testNumber: "",
    author: "",
    listening_audios: [],
    listening: {
      parts: [],
    },
    reading: {
      passages: [],
    },
    writing: {
      tasks: [],
    },
    correct_answers: []
  });

  // Add correct answers state
  const [correctAnswers, setCorrectAnswers] = useState<{
    correct_answers: Array<{
      section: string;
      answers: Array<{
        number: number | number[];
        accepted: string[] | string[][];
        type?: "multi-select-pair";
      }>;
    }>;
  }>({
    correct_answers: [],
  });

  // Add ref to prevent excessive logging
  const lastLoggedStructure = useRef<string>("");

  // Load existing test for editing OR draft from localStorage
  useEffect(() => {
    const loadExistingTest = async () => {
      if (testId) {
        try {
          setIsLoading(true);
          setError("");

          const response = await axios.get(`/api/tests/${testId}`);

          if (response.data.success) {
            const test = response.data.test;

            // Transform the test data to match our form structure
            setTestData({
              title: test.title || "",
              edition: test.edition || "",
              testNumber: test.test_number?.toString() || "",
              author: test.author || "",
              listening_audios: test.listening_audios || [],
              listening: test.listening || { parts: [] },
              reading: test.reading || { passages: [] },
              writing: test.writing || { tasks: [] },
              correct_answers: test.correct_answers || [],
              id: test.id,
            });

            // Load correct answers if they exist
            if (test.correct_answers && Array.isArray(test.correct_answers)) {
              setCorrectAnswers({ correct_answers: test.correct_answers });
            } else {
              setCorrectAnswers({ correct_answers: [] });
            }

            setIsEditMode(true);
            setShowForm(true);

            // Open sections that have data
            setListeningOpen(true);
            setReadingOpen(true);
            setWritingOpen(true);
            // Open correct answers section if it has data
            if (test.correct_answers && test.correct_answers.length > 0) {
              setCorrectAnswersOpen(true);
            }

            setSuccess(`Loaded test: ${test.title}`);
          } else {
            setError("Failed to load test");
          }
        } catch (err: any) {
          console.error("Error loading test:", err);
          setError(err.response?.data?.message || "Failed to load test");
        } finally {
          setIsLoading(false);
        }
      } else {
        // Load draft from localStorage only if not editing
        const savedDraft = localStorage.getItem("ielts-test-draft");
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            setTestData(parsedDraft);
            if (
              parsedDraft.title ||
              parsedDraft.edition ||
              parsedDraft.testNumber ||
              parsedDraft.listening.parts.length > 0 ||
              parsedDraft.reading.passages.length > 0 ||
              parsedDraft.writing.tasks.length > 0
            ) {
              setShowForm(true);
              setListeningOpen(true);
            }
          } catch (error) {
            console.error("Error loading draft from localStorage:", error);
          }
        }
      }
    };

    loadExistingTest();
  }, [testId]);

  const handleListeningAudioUpload = useCallback(
    async (file: File) => {
      try {
        setIsLoading(true);
        setError("");
        setSuccess("");

        const res = await uploadListeningAudio(file, testData.id, setError);
        if (!res) return;

        if (res.data?.success && Array.isArray(res.data.urls)) {
          setTestData((prev) => ({
            ...prev,
            listening_audios: res.data.urls,
          }));
          setSuccess("Audio uploaded successfully.");
          notify.success(
            "Audio uploaded",
            "The listening audio file is now linked to this test."
          );
          return;
        }

        const errorMessage = res.data?.message || "Audio upload failed.";
        setError(errorMessage);
        notify.error("Audio upload failed", errorMessage);
      } catch (err) {
        console.error("Upload error", err);
        const errorMessage = "Failed to upload audio.";
        setError(errorMessage);
        notify.error("Audio upload failed", errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [testData.id]
  );

  // Save to localStorage whenever testData changes (only in create mode)
  useEffect(() => {
    if (showForm && !isEditMode) {
      localStorage.setItem("ielts-test-draft", JSON.stringify(testData));
    }
  }, [testData, showForm, isEditMode]);

  // 🚀 REAL-TIME TEST STRUCTURE LOGGING (Optimized to prevent infinite loops)
  useEffect(() => {
    if (!showForm) return;

    // Create a stable hash of the current structure
    const currentStructureHash = JSON.stringify({
      listening: testData.listening.parts.map((part) => ({
        part: part.part,
        blocksCount: part.questionBlocks.length,
        blocks: part.questionBlocks.map((block) => ({
          type: block.type,
          id: block.id,
          questionStart: block.questionStart,
          questionEnd: block.questionEnd,
          questionsCount: block.questions?.length || 0,
          pairsCount: block.pairs?.length || 0,
          optionsCount: block.options?.length || 0,
        })),
      })),
      reading: testData.reading.passages.map((passage) => ({
        part: passage.part,
        headline: passage.passage.headline,
        paragraphsCount: passage.passage.paragraphs.length,
        blocksCount: passage.questionBlocks.length,
        blocks: passage.questionBlocks.map((block) => ({
          type: block.type,
          id: block.id,
          questionStart: block.questionStart,
          questionEnd: block.questionEnd,
          questionsCount: block.questions?.length || 0,
          pairsCount: block.pairs?.length || 0,
          optionsCount: block.options?.length || 0,
        })),
      })),
      correctAnswersCount: correctAnswers.correct_answers.length,
    });

    // Only log if structure actually changed
    if (currentStructureHash !== lastLoggedStructure.current) {
      lastLoggedStructure.current = currentStructureHash;

      // Use setTimeout with debounce to prevent blocking and excessive logging
      const timeout = setTimeout(() => {
        if (
          testData.listening.parts.length > 0 ||
          testData.reading.passages.length > 0
        ) {
          console.clear();
          console.log("🧪 ===== REAL-TIME TEST STRUCTURE DEBUG =====");
          console.log(
            "📊 Current Test Data:",
            JSON.stringify(testData, null, 2)
          );
          console.log(
            "✅ Correct Answers:",
            JSON.stringify(correctAnswers, null, 2)
          );

          // Log listening structure
          if (testData.listening.parts.length > 0) {
            console.log("🎧 LISTENING STRUCTURE:");
            testData.listening.parts.forEach((part, partIndex) => {
              console.log(`  📁 Part ${part.part} (${part.questionsRange}):`);
              part.questionBlocks.forEach((block, blockIndex) => {
                console.log(
                  `    🧩 Block ${blockIndex + 1}: ${block.type} (Q${block.questionStart
                  }-${block.questionEnd})`
                );
                console.log(
                  `       📝 Instructions: ${block.instructions.length} items`
                );
                console.log(
                  `       🎯 Questions: ${block.questions?.length || 0} items`
                );
                if (block.pairs)
                  console.log(`       🔗 Pairs: ${block.pairs.length} items`);
                if (block.options)
                  console.log(
                    `       📋 Options: ${block.options.length} items`
                  );
                console.log(`       📋 Full Block:`, block);
              });
            });
          }

          // Log reading structure
          if (testData.reading.passages.length > 0) {
            console.log("📖 READING STRUCTURE:");
            testData.reading.passages.forEach((passage, passageIndex) => {
              console.log(`  📁 Passage ${passage.part}:`);
              console.log(`    📰 Headline: "${passage.passage.headline}"`);
              console.log(
                `    📄 Paragraphs: ${passage.passage.paragraphs.length} items`
              );
              passage.questionBlocks.forEach((block, blockIndex) => {
                console.log(
                  `    🧩 Block ${blockIndex + 1}: ${block.type} (Q${block.questionStart
                  }-${block.questionEnd})`
                );
                console.log(
                  `       📝 Instructions: ${block.instructions.length} items`
                );
                console.log(
                  `       🎯 Questions: ${block.questions?.length || 0} items`
                );
                if (block.pairs)
                  console.log(`       🔗 Pairs: ${block.pairs.length} items`);
                if (block.options)
                  console.log(
                    `       📋 Options: ${block.options.length} items`
                  );
                console.log(`       📋 Full Block:`, block);
              });
            });
          }

          console.log("🏁 ===== END TEST STRUCTURE DEBUG =====");

          // 🎯 VALIDATE STRUCTURE AGAINST ALL-TESTS.JSON FORMAT
          console.log("🔍 ===== STRUCTURE VALIDATION =====");

          // Check if structure matches expected format
          try {
            const listeningQuestionCount = testData.listening.parts.reduce(
              (total, part) => total + getQuestionCount(part.questionBlocks),
              0
            );
            const readingQuestionCount = testData.reading.passages.reduce(
              (total, passage) =>
                total + getQuestionCount(passage.questionBlocks),
              0
            );

            console.log("📊 Question Count Validation:", {
              listening: {
                current: listeningQuestionCount,
                expected: 40,
                valid: listeningQuestionCount <= 40,
              },
              reading: {
                current: readingQuestionCount,
                expected: 40,
                valid: readingQuestionCount <= 40,
              },
            });

            // Check questionBlocks structure
            console.log("🏗️ QuestionBlocks Structure Check:");
            testData.listening.parts.forEach((part, partIndex) => {
              part.questionBlocks.forEach((block, blockIndex) => {
                const hasNestedQuestionBlocks =
                  block.questions &&
                  block.questions.some((q) => q.questionBlocks);
                const hasProperStructure =
                  block.hasOwnProperty("questionStart") &&
                  block.hasOwnProperty("questionEnd") &&
                  block.hasOwnProperty("instructions");

                console.log(`  Part ${part.part} Block ${blockIndex + 1}:`, {
                  type: block.type,
                  hasNestedQuestionBlocks: hasNestedQuestionBlocks,
                  hasProperStructure: hasProperStructure,
                  structureValid:
                    !hasNestedQuestionBlocks && hasProperStructure,
                });
              });
            });

            console.log("🏁 ===== END STRUCTURE VALIDATION =====");
          } catch (error) {
            console.error("❌ Error in structure validation:", error);
          }
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(timeout);
    }
  }, [testData, correctAnswers, showForm]);

  // Delete test function
  const deleteTest = () => {
    localStorage.removeItem("ielts-test-draft");
    setTestData({
      title: "",
      edition: "",
      testNumber: "",
      listening_audios: [""],
      author: "",
      listening: { parts: [] },
      reading: { passages: [] },
      writing: { tasks: [] },
      correct_answers: [],
    });
    setCorrectAnswers({ correct_answers: [] });
    setShowForm(false);
    setShowDeleteConfirm(false);
    setListeningOpen(false);
    setReadingOpen(false);
    setWritingOpen(false);
    setCorrectAnswersOpen(false);
  };

  // Helper function to generate UUID + Date.now() based questionId
  const generateUniqueQuestionId = (): string => {
    return `${uuidv4()}-${Date.now()}`;
  };

  // Helper function to renumber all questions sequentially across a section
  const renumberSectionQuestions = (section: "listening" | "reading") => {
    setTestData((prev) => {
      const updated = { ...prev };
      let questionNumber = 1;

      if (section === "listening") {
        updated.listening.parts = updated.listening.parts.map((part) => ({
          ...part,
          questionBlocks: part.questionBlocks.map((block) => {
            // Calculate how many questions this block represents
            const start =
              typeof block.questionStart === "string"
                ? parseInt(block.questionStart)
                : block.questionStart;
            const end =
              typeof block.questionEnd === "string"
                ? parseInt(block.questionEnd)
                : block.questionEnd;
            const questionCount = end - start + 1;

            // Update the block's questionStart and questionEnd
            const updatedBlock = {
              ...block,
              questionStart: questionNumber,
              questionEnd: questionNumber + questionCount - 1,
            };

            // Update questions within the block
            if (block.questions && Array.isArray(block.questions)) {
              updatedBlock.questions = block.questions.map(
                (blockQuestion, index) => {
                  // If the block question has its own questions array, update those
                  if (
                    blockQuestion.questions &&
                    Array.isArray(blockQuestion.questions)
                  ) {
                    return {
                      ...blockQuestion,
                      questionStart: questionNumber,
                      questionEnd: questionNumber + questionCount - 1,
                      questions: blockQuestion.questions.map(
                        (q: any, qIndex: number) => {
                          if (q.isInteractive !== false) {
                            return {
                              ...q,
                              questionId: generateUniqueQuestionId(),
                              questionNumber: questionNumber + qIndex,
                              number: (questionNumber + qIndex).toString(),
                            };
                          }
                          return q;
                        }
                      ),
                    };
                  }
                  // If the block question is a direct question
                  if (blockQuestion.isInteractive !== false) {
                    return {
                      ...blockQuestion,
                      questionId: generateUniqueQuestionId(),
                      questionNumber: questionNumber + index,
                      number: (questionNumber + index).toString(),
                    };
                  }
                  return blockQuestion;
                }
              );
            }

            questionNumber += questionCount;
            return updatedBlock;
          }),
        }));
      } else {
        updated.reading.passages = updated.reading.passages.map((passage) => ({
          ...passage,
          questionBlocks: passage.questionBlocks.map((block) => {
            // Calculate how many questions this block represents
            const start =
              typeof block.questionStart === "string"
                ? parseInt(block.questionStart)
                : block.questionStart;
            const end =
              typeof block.questionEnd === "string"
                ? parseInt(block.questionEnd)
                : block.questionEnd;
            const questionCount = end - start + 1;

            // Update the block's questionStart and questionEnd
            const updatedBlock = {
              ...block,
              questionStart: questionNumber,
              questionEnd: questionNumber + questionCount - 1,
            };

            // Update questions within the block
            if (block.questions && Array.isArray(block.questions)) {
              updatedBlock.questions = block.questions.map(
                (blockQuestion, index) => {
                  // If the block question has its own questions array, update those
                  if (
                    blockQuestion.questions &&
                    Array.isArray(blockQuestion.questions)
                  ) {
                    return {
                      ...blockQuestion,
                      questionStart: questionNumber,
                      questionEnd: questionNumber + questionCount - 1,
                      questions: blockQuestion.questions.map(
                        (q: any, qIndex: number) => {
                          if (q.isInteractive !== false) {
                            return {
                              ...q,
                              questionId: generateUniqueQuestionId(),
                              questionNumber: questionNumber + qIndex,
                              number: (questionNumber + qIndex).toString(),
                            };
                          }
                          return q;
                        }
                      ),
                    };
                  }
                  // If the block question is a direct question
                  if (blockQuestion.isInteractive !== false) {
                    return {
                      ...blockQuestion,
                      questionId: generateUniqueQuestionId(),
                      questionNumber: questionNumber + index,
                      number: (questionNumber + index).toString(),
                    };
                  }
                  return blockQuestion;
                }
              );
            }

            questionNumber += questionCount;
            return updatedBlock;
          }),
        }));
      }

      return updated;
    });
  };

  // Create default question blocks for different types
  const createDefaultQuestionBlock = (type: string): BaseQuestionBlock => {
    // Generate unique ID with timestamp to ensure uniqueness
    const blockId = `${uuidv4()}-${Date.now()}`;

    const baseBlock: BaseQuestionBlock = {
      id: blockId,
      type,
      questionStart: 1,
      questionEnd: 1,
      instructions: ["Enter instructions here..."],
      answerConstraints: "ONE WORD AND/OR A NUMBER",
      isInteractive: false,
      questions: [],
    };

    // Add type-specific default data
    switch (type) {
      case "multiple-choice":
        return {
          ...baseBlock,
          inputType: "radio",
          questions: [
            {
              answer: {
                correct: "A",
                accepted: [],
              },
              options: [
                { text: "Option A", variant: "A", isInteractive: true },
                { text: "Option B", variant: "B", isInteractive: true },
                { text: "Option C", variant: "C", isInteractive: true },
              ],
              questionId: generateUniqueQuestionId(),
              questionText: "Enter question text here...",
              questionNumber: "1",
            },
          ],
        };
      case "multiple-select":
        return {
          ...baseBlock,
          choices: [{ variant: "A", text: "A choice" }],
        };
      case "matching":
      case "matching-information":
      case "matching-features":
      case "matching-sentence-endings":
      case "matching-paragraphs":
        return {
          ...baseBlock,
          pairs: [
            {
              item: "Enter item text here...",
              match: "a",
              number: "1",
              isInteractive: true,
            },
          ],
          options: [
            {
              text: "Option text",
              label: "A",
              variant: "A",
            },
          ],
          questions: [], // Empty as per all-tests.json structure
          optionsAtATime: "1",
        };
      case "matching-headers":
      case "match-heading":
        return {
          ...baseBlock,
          type: "match-heading",
          questionId: generateUniqueQuestionId(),
          options: [
            { variant: "i", text: "Heading option 1" },
            { variant: "ii", text: "Heading option 2" },
            { variant: "iii", text: "Heading option 3" },
          ],
          questions: [],
        };
      case "form-completion":
      case "sentence-completion":
      case "short-answer":
      case "note-completion":
        return {
          ...baseBlock,
          questions: [
            {
              text: "Enter text here... Use ____ for blanks",
              questionId: generateUniqueQuestionId(),
              isInteractive: true,
              questionNumber: "1",
            },
          ],
        };
      case "summary-completion":
        return {
          ...baseBlock,
          text: "Enter summary text with ____ blanks here...",
          answers: [{ number: 1, correctAnswer: "" }],
          questionId: generateUniqueQuestionId(),
          questions: [],
        };
      case "summary-select-completion":
        return {
          ...baseBlock,
          text: "Enter summary text with ____ blanks here...",
          answers: [{ number: 1, correctAnswer: "a" }],
          options: ["option1", "option2", "option3"],
          questionId: generateUniqueQuestionId(),
          questions: [],
        };
      case "true-false-not-given":
        return {
          ...baseBlock,
          inputType: "radio",
          questions: [
            {
              questionId: generateUniqueQuestionId(),
              questionNumber: 1,
              questionText: "",
              options: [
                { text: "TRUE", isInteractive: true },
                { text: "FALSE", isInteractive: true },
                { text: "NOT GIVEN", isInteractive: true },
              ],
              answer: { correct: "TRUE" },
            },
          ],
        };
      case "yes-no-not-given":
        return {
          ...baseBlock,
          inputType: "radio",
          questions: [
            {
              questionId: generateUniqueQuestionId(),
              questionNumber: 1,
              questionText: "",
              options: [
                { text: "YES", isInteractive: true },
                { text: "NO", isInteractive: true },
                { text: "NOT GIVEN", isInteractive: true },
              ],
              answer: { correct: "YES" },
            },
          ],
        };
      case "map-labelling":
        return {
          ...baseBlock,
          image: { url: "", headline: "Map" },
          labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
          questions: [
            {
              text: "Location name",
              number: "1",
              questionId: generateUniqueQuestionId(),
              questionNumber: 1,
            },
          ],
        };
      case "diagram-labelling":
        return {
          ...baseBlock,
          image: { url: "", headline: "Diagram" },
          questions: [
            {
              text: "Label text ____",
              number: "1",
              questionId: generateUniqueQuestionId(),
              isInteractive: true,
              questionNumber: 1,
            },
          ],
        };
      case "table-completion":
        return {
          ...baseBlock,
          cols: ["Column 1", "Column 2"],
          rows: [
            {
              name: "Row 1",
              cells: [
                { content: "Cell content..." },
                {
                  content: "Cell with ____ input",
                  isInput: true,
                  questionNumber: "1",
                },
              ],
            },
          ],
          headline: "Table headline",
          rowHeaderName: "Row Header",
          questions: [],
        };
      case "flowchart-completion":
      case "flow-chart":
        return {
          ...baseBlock,
          type: "flow-chart",
          nodes: [
            {
              id: generateUniqueQuestionId(),
              text: "Enter node text here...",
              position: "bottom",
              isInteractive: false,
            },
          ],
          questions: [],
        };

      default:
        return baseBlock;
    }
  };

  // Enhanced function to calculate question count from questionStart and questionEnd
  const getQuestionCount = (blocks: BaseQuestionBlock[]) => {
    return blocks.reduce((total, block) => {
      // Handle blocks with direct questionStart/questionEnd (like matching types)
      if (block.questionStart && block.questionEnd) {
        const start =
          typeof block.questionStart === "string"
            ? parseInt(block.questionStart)
            : block.questionStart;
        const end =
          typeof block.questionEnd === "string"
            ? parseInt(block.questionEnd)
            : block.questionEnd;
        return total + (end - start + 1);
      }

      // For blocks with questions array, count individual questions with questionStart/questionEnd
      if (block.questions && Array.isArray(block.questions)) {
        return (
          total +
          block.questions.reduce((questionTotal, question) => {
            if (question.questionStart && question.questionEnd) {
              const qStart =
                typeof question.questionStart === "string"
                  ? parseInt(question.questionStart)
                  : question.questionStart;
              const qEnd =
                typeof question.questionEnd === "string"
                  ? parseInt(question.questionEnd)
                  : question.questionEnd;
              return questionTotal + (qEnd - qStart + 1);
            }
            return questionTotal + 1;
          }, 0)
        );
      }

      return total + 1; // Default to 1 question per block
    }, 0);
  };

  const initializeTest = () => {
    // Initialize with 4 listening parts (10 questions each)
    const listeningParts: ListeningPart[] = Array.from(
      { length: 4 },
      (_, i) => ({
        part: (i + 1).toString(),
        questionsRange: `${i * 10 + 1}-${(i + 1) * 10}`,
        questionBlocks: [],
      })
    );

    // Initialize with 3 reading passages
    const readingPassages: ReadingPassage[] = Array.from(
      { length: 3 },
      (_, i) => ({
        part: (i + 1).toString(),
        instructions: `Read the text below and answer Questions ${i * 13 + 1}-${(i + 1) * 13 + (i === 2 ? 1 : 0)
          }.`,
        passage: {
          headline: `Passage ${i + 1} Headline`,
          subHeadline: `Passage ${i + 1} Sub-headline`,
          paragraphs: [
            {
              header: "A",
              tag: "A",
              content: "Enter paragraph content here...",
            },
          ],
        },
        questionBlocks: [],
        questionStart: "",
        questionEnd: "",
      })
    );

    // Initialize writing tasks
    const writingTasks: WritingTask[] = [
      {
        task: "1",
        instructions: [
          "The chart below shows...",
          "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        ],
        image: "",
      },
      {
        task: "2",
        instructions: [
          "Some people think that...",
          "Discuss both these views and give your own opinion.",
        ],
      },
    ];

    setTestData((prev) => ({
      ...prev,
      listening: { parts: listeningParts },
      reading: { passages: readingPassages },
      writing: { tasks: writingTasks },
    }));

    setShowForm(true);
    setListeningOpen(true);
  };

  // Enhanced addQuestionBlock function with UUID + Date.now() questionId
  const addQuestionBlock = (
    section: "listening" | "reading",
    partIndex: number,
    type: string
  ) => {
    console.log('➕ Adding question block:', { section, partIndex, type, dialogOpen: questionTypeDialog.open });

    // Validate that the part/passage exists
    if (section === "listening" && !testData.listening.parts[partIndex]) {
      console.error(`❌ Listening part ${partIndex} does not exist`);
      setError(`Cannot add block: Listening part ${partIndex + 1} does not exist`);
      return;
    }
    
    if (section === "reading" && !testData.reading.passages[partIndex]) {
      console.error(`❌ Reading passage ${partIndex} does not exist`);
      setError(`Cannot add block: Reading passage ${partIndex + 1} does not exist`);
      return;
    }

    // Calculate current question count for proper numbering
    const currentBlocks =
      section === "listening"
        ? testData.listening.parts[partIndex].questionBlocks
        : testData.reading.passages[partIndex].questionBlocks;

    const currentQuestionCount = getQuestionCount(currentBlocks);

    // Apply section-wide 40-question limit
    const maxQuestions = 40; // Each section (listening/reading) has 40 questions max

    // Count total questions in section
    const allParts =
      section === "listening"
        ? testData.listening.parts
        : testData.reading.passages;

    const totalSectionQuestions = allParts.reduce((total, part) => {
      return total + getQuestionCount(part.questionBlocks || []);
    }, 0);

    if (totalSectionQuestions >= maxQuestions) {
      console.error(`❌ Section limit reached: ${totalSectionQuestions}/${maxQuestions}`);
      setError(
        `Cannot add more questions. ${section} section already has ${totalSectionQuestions} questions (maximum: ${maxQuestions}).`
      );
      setQuestionTypeDialog((prev) => ({ ...prev, open: false }));
      return;
    }

    // Create new block with proper question numbering and UUID-based questionId
    const newBlock = createDefaultQuestionBlock(type);
    
    // Calculate the next question number based on the CURRENT PART's highest question number
    const currentPartBlocks = section === "listening"
      ? testData.listening.parts[partIndex].questionBlocks
      : testData.reading.passages[partIndex].questionBlocks;
    
    let nextQuestionNumber = 1;
    if (currentPartBlocks && currentPartBlocks.length > 0) {
      // Find the highest questionEnd in current part
      const highestQuestionEnd = Math.max(
        ...currentPartBlocks.map(block => {
          const end = typeof block.questionEnd === 'string' 
            ? parseInt(block.questionEnd) 
            : block.questionEnd;
          return end || 0;
        })
      );
      nextQuestionNumber = highestQuestionEnd + 1;
    } else {
      // If this is the first block in the part, find the highest question number from previous parts
      const previousParts = section === "listening"
        ? testData.listening.parts.slice(0, partIndex)
        : testData.reading.passages.slice(0, partIndex);
      
      if (previousParts.length > 0) {
        const allPreviousBlocks = previousParts.flatMap(part => part.questionBlocks || []);
        if (allPreviousBlocks.length > 0) {
          const highestPreviousQuestion = Math.max(
            ...allPreviousBlocks.map(block => {
              const end = typeof block.questionEnd === 'string' 
                ? parseInt(block.questionEnd) 
                : block.questionEnd;
              return end || 0;
            })
          );
          nextQuestionNumber = highestPreviousQuestion + 1;
        }
      }
    }

    console.log('📊 Calculated next question number:', {
      partIndex,
      currentPartBlocksCount: currentPartBlocks?.length || 0,
      nextQuestionNumber,
      totalSectionQuestions
    });

    // Set proper question start/end based on calculated number
    newBlock.questionStart = nextQuestionNumber;
    newBlock.questionEnd = nextQuestionNumber;

    // If the block has questions array, update questions with UUID-based questionId
    if (newBlock.questions && newBlock.questions.length > 0) {
      newBlock.questions = newBlock.questions.map((blockQuestion, index) => {
        // If the block question has its own questions array (like matching-headers)
        if (blockQuestion.questions && Array.isArray(blockQuestion.questions)) {
          return {
            ...blockQuestion,
            questionStart: nextQuestionNumber,
            questionEnd: nextQuestionNumber,
            questions: blockQuestion.questions.map(
              (q: any, qIndex: number) => ({
                ...q,
                questionId: generateUniqueQuestionId(),
                questionNumber: nextQuestionNumber + qIndex,
                number: (nextQuestionNumber + qIndex).toString(),
              })
            ),
          };
        }
        // If the block question is a direct question
        return {
          ...blockQuestion,
          questionId: generateUniqueQuestionId(),
          questionNumber: nextQuestionNumber + index,
          number: (nextQuestionNumber + index).toString(),
        };
      });
    }

    // Close the dialog after adding the block
    setQuestionTypeDialog((prev) => ({ ...prev, open: false }));

    // Update test data
    if (section === "listening") {
      setTestData((prev) => {
        const updated = { ...prev };
        
        // Ensure questionBlocks array exists
        if (!updated.listening.parts[partIndex].questionBlocks) {
          console.warn(`Initializing questionBlocks array for Listening Part ${partIndex + 1}`);
          updated.listening.parts[partIndex].questionBlocks = [];
        }
        
        updated.listening.parts[partIndex].questionBlocks.push(newBlock);

        // Real-time block addition logging.
        console.log(
          `Successfully added ${type} block to Listening Part ${partIndex + 1}:`,
          {
            blockType: type,
            questionRange: `${newBlock.questionStart}-${newBlock.questionEnd}`,
            totalBlocksInPart:
              updated.listening.parts[partIndex].questionBlocks.length,
            totalListeningQuestions: updated.listening.parts.reduce(
              (total, part) => total + getQuestionCount(part.questionBlocks),
              0
            ),
            newBlock: newBlock,
          }
        );

        return updated;
      });
    } else {
      setTestData((prev) => {
        const updated = { ...prev };
        
        // Ensure questionBlocks array exists
        if (!updated.reading.passages[partIndex].questionBlocks) {
          console.warn(`Initializing questionBlocks array for Reading Passage ${partIndex + 1}`);
          updated.reading.passages[partIndex].questionBlocks = [];
        }
        
        updated.reading.passages[partIndex].questionBlocks.push(newBlock);

        // Add droppableArea and questionNumber to paragraphs for match-heading.
        if (type === "match-heading" || type === "matching-headers") {
          const paragraphs =
            updated.reading.passages[partIndex].passage.paragraphs;
          paragraphs.forEach((paragraph: any, idx: number) => {
            paragraph.droppableArea = true;
            // Only set questionNumber if it doesn't already exist
            if (!paragraph.questionNumber) {
              paragraph.questionNumber = nextQuestionNumber + idx;
            }
          });

          // Update questionEnd based on paragraph question numbers
          if (paragraphs.length > 0) {
            const maxQuestionNumber = paragraphs.reduce(
              (max, p) => Math.max(max, p.questionNumber || nextQuestionNumber),
              nextQuestionNumber
            );
            newBlock.questionEnd = maxQuestionNumber;
          }
        }

        // 🚀 REAL-TIME BLOCK ADDITION LOGGING
        console.log(
          `✅ Successfully added ${type} block to Reading Passage ${partIndex + 1}:`,
          {
            blockType: type,
            questionRange: `${newBlock.questionStart}-${newBlock.questionEnd}`,
            totalBlocksInPassage:
              updated.reading.passages[partIndex].questionBlocks.length,
            totalReadingQuestions: updated.reading.passages.reduce(
              (total, passage) =>
                total + getQuestionCount(passage.questionBlocks),
              0
            ),
            newBlock: newBlock,
          }
        );

        return updated;
      });
    }
  };

  // Handler for opening question type dialog
  const openQuestionTypeDialog = (
    section: "listening" | "reading",
    partIndex: number
  ) => {
    console.log('🔓 Opening question type dialog:', { section, partIndex });
    setQuestionTypeDialog({
      open: true,
      section,
      partIndex,
    });
  };

  // Handler for selecting question type
  const handleQuestionTypeSelect = (questionType: string) => {
    console.log('🎯 Question type selected:', { 
      questionType, 
      section: questionTypeDialog.section, 
      partIndex: questionTypeDialog.partIndex 
    });
    addQuestionBlock(
      questionTypeDialog.section,
      questionTypeDialog.partIndex,
      questionType
    );
  };

  const updateQuestionBlock = useCallback(
    (
      section: "listening" | "reading",
      partIndex: number,
      blockIndex: number,
      updatedBlock: any
    ) => {
      if (section === "listening") {
        setTestData((prev) => {
          const updated = { ...prev };
          updated.listening.parts[partIndex].questionBlocks[blockIndex] = {
            ...updated.listening.parts[partIndex].questionBlocks[blockIndex],
            ...updatedBlock,
          };
          return updated;
        });
      } else {
        setTestData((prev) => {
          const updated = { ...prev };
          updated.reading.passages[partIndex].questionBlocks[blockIndex] = {
            ...updated.reading.passages[partIndex].questionBlocks[blockIndex],
            ...updatedBlock,
          };
          return updated;
        });
      }
    },
    []
  );

  const removeQuestionBlock = (
    section: "listening" | "reading",
    partIndex: number,
    blockIndex: number
  ) => {
    if (section === "listening") {
      setTestData((prev) => {
        const updated = { ...prev };
        const removedBlock =
          updated.listening.parts[partIndex].questionBlocks[blockIndex];
        updated.listening.parts[partIndex].questionBlocks.splice(blockIndex, 1);

        // 🚀 REAL-TIME BLOCK REMOVAL LOGGING
        console.log(`❌ Removed block from Listening Part ${partIndex + 1}:`, {
          removedBlockType: removedBlock.type,
          removedQuestionRange: `${removedBlock.questionStart}-${removedBlock.questionEnd}`,
          remainingBlocks:
            updated.listening.parts[partIndex].questionBlocks.length,
          totalListeningQuestions: updated.listening.parts.reduce(
            (total, part) => total + getQuestionCount(part.questionBlocks),
            0
          ),
        });

        return updated;
      });
    } else {
      setTestData((prev) => {
        const updated = { ...prev };
        const removedBlock =
          updated.reading.passages[partIndex].questionBlocks[blockIndex];
        updated.reading.passages[partIndex].questionBlocks.splice(
          blockIndex,
          1
        );

        // 🚀 Remove droppableArea and questionNumber from paragraphs for match-heading
        if (
          removedBlock.type === "match-heading" ||
          removedBlock.type === "matching-headers"
        ) {
          const paragraphs =
            updated.reading.passages[partIndex].passage.paragraphs;
          paragraphs.forEach((paragraph: any) => {
            delete paragraph.droppableArea;
            delete paragraph.questionNumber;
          });
        }

        // 🚀 REAL-TIME BLOCK REMOVAL LOGGING
        console.log(`❌ Removed block from Reading Passage ${partIndex + 1}:`, {
          removedBlockType: removedBlock.type,
          removedQuestionRange: `${removedBlock.questionStart}-${removedBlock.questionEnd}`,
          remainingBlocks:
            updated.reading.passages[partIndex].questionBlocks.length,
          totalReadingQuestions: updated.reading.passages.reduce(
            (total, passage) =>
              total + getQuestionCount(passage.questionBlocks),
            0
          ),
        });

        return updated;
      });
    }
  };

  // Move question block within a part/passage
  const moveQuestionBlock = useCallback(
    (
      section: "listening" | "reading",
      dragInfo: {
        dragIndex: number;
        hoverIndex: number;
        dragPartIndex: number;
        hoverPartIndex: number;
      }
    ) => {
      const { dragIndex, hoverIndex, dragPartIndex, hoverPartIndex } = dragInfo;

      setTestData((prev) => {
        const updated = { ...prev };

        if (section === "listening") {
          const sourcePart = updated.listening.parts[dragPartIndex];
          const targetPart = updated.listening.parts[hoverPartIndex];

          // Remove from source
          const [draggedBlock] = sourcePart.questionBlocks.splice(dragIndex, 1);

          // If moving to different part, add to target part
          if (dragPartIndex !== hoverPartIndex) {
            targetPart.questionBlocks.splice(hoverIndex, 0, draggedBlock);
          } else {
            // Same part, just reorder
            sourcePart.questionBlocks.splice(hoverIndex, 0, draggedBlock);
          }
        } else if (section === "reading") {
          const sourcePassage = updated.reading.passages[dragPartIndex];
          const targetPassage = updated.reading.passages[hoverPartIndex];

          // Remove from source
          const [draggedBlock] = sourcePassage.questionBlocks.splice(dragIndex, 1);

          // If moving to different passage, add to target passage
          if (dragPartIndex !== hoverPartIndex) {
            targetPassage.questionBlocks.splice(hoverIndex, 0, draggedBlock);
          } else {
            // Same passage, just reorder
            sourcePassage.questionBlocks.splice(hoverIndex, 0, draggedBlock);
          }
        }

        return updated;
      });
    },
    []
  );

  const renderQuestionBlockAdmin = useCallback(
    (
      block: BaseQuestionBlock,
      section: "listening" | "reading",
      partIndex: number,
      blockIndex: number
    ) => {
      const onChange = (updatedBlock: any) => {
        updateQuestionBlock(section, partIndex, blockIndex, updatedBlock);
      };

      // Create unique key for each component to prevent collisions
      const componentKey = `${section}-${partIndex}-${blockIndex}-${block.id}`;

      // Map components based on type with correct prop structures
      switch (block.type) {
        case "multiple-choice":
          return (
            <MultipleChoiceAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "multiple-select":
          return section === "reading" ? (
            <MultipleSelectAdminReading
              key={componentKey}
              data={block as any}
              onChange={onChange as any}
            />
          ) : (
            <MultipleSelectAdmin
              key={componentKey}
              data={block as any}
              onChange={onChange as any}
            />
          );
        case "matching":
        case "matching-information":
        case "matching-features":
        case "matching-sentence-endings":
        case "matching-paragraphs":
          return (
            <MatchingAdmin
              key={componentKey}
              data={block as any}
              onChange={onChange as any}
            />
          );
        case "matching-headers":
        case "match-heading":
          return (
            <MatchHeadingAdmin
              key={componentKey}
              data={block as any}
              onChange={onChange as any}
            />
          );
        case "form-completion":
        case "sentence-completion":
        case "short-answer":
        case "note-completion":
          return (
            <FormCompletionAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "summary-completion":
          return (
            <SummaryCompletionAdmin
              key={componentKey}
              questionBlock={block as any}
              onChange={onChange as any}
            />
          );
        case "summary-select-completion":
          return (
            <SummarySelectCompletionAdmin
              key={componentKey}
              questionBlock={block as any}
              onChange={onChange as any}
            />
          );
        case "flowchart-completion":
        case "flow-chart":
          return (
            <FlowChartAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "table-completion":
          return (
            <TableCompletionAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "diagram-labelling":
        case "diagram-label-completion":
          return (
            <DiagramLabellingAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "map-labelling":
          return (
            <MapLabellingAdmin
              key={componentKey}
              questionBlock={block as any}
              onChange={onChange as any}
            />
          );
        case "true-false-not-given":
          return (
            <TrueFalseNotGivenAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        case "yes-no-not-given":
          return (
            <YesNoNotGivenAdmin
              key={componentKey}
              question={block as any}
              onChange={onChange as any}
            />
          );
        default:
          return (
            <Card key={componentKey} className="p-4">
              <p className="text-sm text-gray-500">
                Component for "{block.type}" not implemented yet
              </p>
            </Card>
          );
      }
    },
    [updateQuestionBlock]
  );

  const saveTestToSupabase = async () => {
    if (!testData.title || !testData.edition || !testData.testNumber) {
      setError(
        "Please fill in all required fields (Title, Edition, Test Number)"
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // 🚀 FINAL SAVE STRUCTURE LOGGING
      console.log("💾 ===== SAVING TEST TO SUPABASE =====");
      console.log(
        "📊 Final Test Structure Before Save:",
        JSON.stringify(testData, null, 2)
      );
      console.log(
        "✅ Final Correct Answers Before Save:",
        JSON.stringify(correctAnswers, null, 2)
      );
      console.log("📈 Final Structure Summary:", {
        title: testData.title,
        edition: testData.edition,
        testNumber: testData.testNumber,
        listeningParts: testData.listening.parts.length,
        readingPassages: testData.reading.passages.length,
        writingTasks: testData.writing.tasks.length,
        listeningQuestions: testData.listening.parts.reduce(
          (total, part) => total + getQuestionCount(part.questionBlocks),
          0
        ),
        readingQuestions: testData.reading.passages.reduce(
          (total, passage) => total + getQuestionCount(passage.questionBlocks),
          0
        ),
        correctAnswersSections: correctAnswers.correct_answers.length,
        totalCorrectAnswers: correctAnswers.correct_answers.reduce(
          (total, section) => total + section.answers.length,
          0
        ),
      });

      // Save all sections in a single API call (supports partial completion)
      // Check which sections have content
      const hasListeningContent = testData.listening.parts && testData.listening.parts.length > 0;
      const hasReadingContent = testData.reading.passages && testData.reading.passages.length > 0;
      const hasWritingContent = testData.writing.tasks && testData.writing.tasks.length > 0;

      // Validate that at least one section has content
      if (!hasListeningContent && !hasReadingContent && !hasWritingContent) {
        setError("Please add at least one section (Listening, Reading, or Writing) before saving.");
        setIsLoading(false);
        return;
      }

      // Build payload with only sections that have content
      const payload = {
        title: testData.title,
        edition: testData.edition,
        test_number: parseInt(testData.testNumber),
        listening: hasListeningContent ? testData.listening : null,
        reading: hasReadingContent ? testData.reading : null,
        writing: hasWritingContent ? testData.writing : null,
        listening_audios: testData.listening_audios,
        correct_answers: correctAnswers.correct_answers,
      };

      console.log("📦 Saving sections:", {
        hasListening: hasListeningContent,
        hasReading: hasReadingContent,
        hasWriting: hasWritingContent,
      });

      const existingTestId = testId || testData.id;
      const response = existingTestId
        ? await axios.put(`/api/tests/${existingTestId}`, payload)
        : await axios.post("/api/tests", payload);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to save test"
        );
      }

      const savedTestId = response.data.test?.id;
      if (savedTestId) {
        setTestData((prev) => ({ ...prev, id: savedTestId }));
      }

      if (!existingTestId && savedTestId) {
        setIsEditMode(true);
        window.history.replaceState(
          null,
          "",
          `/admin/tests/create-test-dynamic?id=${savedTestId}`
        );
      }

      // Show which sections were saved
      const savedSections: string[] = [];
      if (hasListeningContent) savedSections.push("Listening");
      if (hasReadingContent) savedSections.push("Reading");
      if (hasWritingContent) savedSections.push("Writing");

      const sectionsText = savedSections.length > 0
        ? ` (${savedSections.join(", ")})`
        : "";

      setSuccess(
        existingTestId
          ? `Test updated successfully!${sectionsText}`
          : `Test saved successfully to Supabase!${sectionsText} You can continue editing and save again.`
      );

      if (!existingTestId) {
        localStorage.removeItem("ielts-test-draft");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    if (testId && isLoading) {
      return <PageState type="loading" title="Loading test editor" />;
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">IELTS Test Creator</h1>
          <p className="text-gray-600 mb-8">
            Create IELTS tests dynamically with collapsible sections and
            question blocks
          </p>

          <Button onClick={initializeTest} size="lg" className="px-8 py-3">
            <Plus className="w-5 h-5 mr-2" />
            Create Test
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit IELTS Test" : "Create New IELTS Test"}
          </h1>
          {isEditMode && testData.title && (
            <p className="text-sm text-muted-foreground mt-1">
              Editing: {testData.title} - {testData.edition} (Test{" "}
              {testData.testNumber})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <LoadingButton
            type="button"
            onClick={saveTestToSupabase}
            loading={isLoading}
            loadingText="Saving test..."
            icon={Save}
            className="px-6"
          >
            Save test
          </LoadingButton>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      </div>

      {error && (
        <AppAlert tone="error" title="Something went wrong">
          {error}
        </AppAlert>
      )}

      {success && (
        <AppAlert tone="success" title="Saved">
          {success}
        </AppAlert>
      )}

      {/* Test Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="testNumber">Test Number *</Label>
            <Input
              id="testNumber"
              value={testData.testNumber || ""}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, testNumber: e.target.value }))
              }
              placeholder="1"
            />
          </div>
          <div>
            <Label htmlFor="edition">Edition *</Label>
            <Input
              id="edition"
              value={testData.edition || ""}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, edition: e.target.value }))
              }
              placeholder="Cambridge 19"
            />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={testData.author || ""}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, author: e.target.value }))
              }
              placeholder="Cambridge"
            />
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={testData.title || ""}
              onChange={(e) =>
                setTestData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Cambridge IELTS 19 Test 1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listening Audios Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listening Audio</span>
            <StatusBadge
              status={testData.listening_audios?.length > 0 ? "saved" : "neutral"}
              label={testData.listening_audios?.length > 0 ? "Uploaded" : "No audio"}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!testData.id && (
            <AppAlert tone="warning" title="Save required">
              Save the test before uploading audio.
            </AppAlert>
          )}
          {/* Existing Audio */}
          {testData.listening_audios && testData.listening_audios.length > 0 ? (
            <div className="space-y-3">
              {testData.listening_audios.map((url, index) => (
                <Card key={index} className="rounded-lg border bg-card p-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Listening Audio
                      </Label>
                      <div className="flex gap-2">
                        {/* Replace Button */}
                        <LoadingButton
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={isLoading}
                          loadingText="Uploading audio..."
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "audio/*";
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
                              if (!file) return;
                              await handleListeningAudioUpload(file);
                            };
                            input.click();
                          }}
                        >
                          Replace
                        </LoadingButton>

                        {/* Delete Button
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete Audio ${index + 1}?`)) {
                              try {
                                setIsLoading(true);
                                setError("");
                                setSuccess("");

                                const res = await deleteListeningAudio(testData.id, setError);
                                if (!res) return;

                                if (res.data?.success) {
                                  setTestData((prev) => ({
                                    ...prev,
                                    listening_audios: [],
                                  }));
                                  setSuccess("Audio deleted successfully.");
                                } else {
                                  setError(res.data?.message || "Audio delete failed.");
                                }
                              } catch (err) {
                                console.error("Delete error:", err);
                                setError("Failed to delete audio.");
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button> */}
                      </div>
                    </div>

                    {/* Audio Player */}
                    <audio
                      controls
                      className="w-full"
                      src={buildMediaUrl(url)}
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>

                    {/* URL Display */}
                    <div className="text-xs text-gray-500 truncate">{url}</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No audio file uploaded yet.</p>
              <p className="text-sm">
                Click "Add Audio" below to upload the listening audio.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Only one audio file is supported per test.
              </p>
            </div>
          )}

          {/* Add New Audio Button */}
          <LoadingButton
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
            disabled={isLoading || !testData.id}
            loading={isLoading}
            loadingText="Uploading audio..."
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "audio/*";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                await handleListeningAudioUpload(file);
              };
              input.click();
            }}
          >
            {!isLoading && <Plus className="w-4 h-4 mr-2" />}
            {testData.listening_audios?.length > 0
              ? "Replace Audio"
              : "Add Audio"}
          </LoadingButton>
        </CardContent>
      </Card>
      {/* Listening Section */}
      <Card>
        <Collapsible open={listeningOpen} onOpenChange={setListeningOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Listening Section (1-40)
                  <StatusBadge
                    status="info"
                    label={`${testData.listening.parts.reduce(
                      (total, part) =>
                        total + getQuestionCount(part.questionBlocks),
                      0
                    )} / 40 questions`}
                  />
                </CardTitle>
                {listeningOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <DndProvider backend={HTML5Backend}>
                {testData.listening.parts.map((part, partIndex) => (
                  <Collapsible
                    key={part.part}
                    open={listeningPartsOpen[part.part]}
                    onOpenChange={(open) =>
                      setListeningPartsOpen((prev) => ({
                        ...prev,
                        [part.part]: open,
                      }))
                    }
                  >
                    <Card className="rounded-lg border bg-card p-4 shadow-xs">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              Part {part.part} ({part.questionsRange})
                              <StatusBadge
                                status="info"
                                label={`${getQuestionCount(part.questionBlocks)} / 10 questions`}
                              />
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Dialog
                                open={
                                  questionTypeDialog.open &&
                                  questionTypeDialog.section === "listening" &&
                                  questionTypeDialog.partIndex === partIndex
                                }
                                onOpenChange={(open) =>
                                  !open &&
                                  setQuestionTypeDialog((prev) => ({
                                    ...prev,
                                    open: false,
                                  }))
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openQuestionTypeDialog("listening", partIndex);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Question Block
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Select Question Type</DialogTitle>
                                    <DialogDescription>
                                      Choose the type of question block to add to Part{" "}
                                      {part.part}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-1 gap-2 py-4">
                                    {LISTENING_QUESTION_TYPES.map((type) => (
                                      <Button
                                        key={type.value}
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() =>
                                          handleQuestionTypeSelect(type.value)
                                        }
                                      >
                                        {type.label}
                                      </Button>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {listeningPartsOpen[part.part] ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          {part.questionBlocks.map((block, blockIndex) => {
                            const blockKey = `listening-${partIndex}-${block.id}`;
                            return (
                              <DraggableQuestionBlock
                                key={blockKey}
                                block={block}
                                blockIndex={blockIndex}
                                section="listening"
                                partIndex={partIndex}
                                isOpen={listeningBlocksOpen[blockKey] !== false}
                                onToggle={() => {
                                  setListeningBlocksOpen(prev => ({
                                    ...prev,
                                    [blockKey]: !prev[blockKey]
                                  }));
                                }}
                                onMove={(dragInfo) =>
                                  moveQuestionBlock("listening", dragInfo)
                                }
                                onRemove={() =>
                                  removeQuestionBlock(
                                    "listening",
                                    partIndex,
                                    blockIndex
                                  )
                                }
                                renderAdmin={() =>
                                  renderQuestionBlockAdmin(
                                    block,
                                    "listening",
                                    partIndex,
                                    blockIndex
                                  )
                                }
                              />
                            );
                          })}
                          {part.questionBlocks.length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                              No question blocks added yet
                            </p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </DndProvider>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Reading Section */}
      <Card>
        <Collapsible open={readingOpen} onOpenChange={setReadingOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Reading Section (1-40)
                  <StatusBadge
                    status="info"
                    label={`${testData.reading.passages.reduce(
                      (total, passage) =>
                        total + getQuestionCount(passage.questionBlocks),
                      0
                    )} / 40 questions`}
                  />

                </CardTitle>
                {readingOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <DndProvider backend={HTML5Backend}>
                {testData.reading.passages.map((passage, passageIndex) => (
                  <Collapsible
                    key={passage.part}
                    open={readingPassagesOpen[passage.part]}
                    onOpenChange={(open) =>
                      setReadingPassagesOpen((prev) => ({
                        ...prev,
                        [passage.part]: open,
                      }))
                    }
                  >
                    <Card className="rounded-lg border bg-card p-4 shadow-xs">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              Passage {passage.part}
                              <StatusBadge
                                status="info"
                                label={`${getQuestionCount(passage.questionBlocks)} questions`}
                              />
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Dialog
                                open={
                                  questionTypeDialog.open &&
                                  questionTypeDialog.section === "reading" &&
                                  questionTypeDialog.partIndex === passageIndex
                                }
                                onOpenChange={(open) =>
                                  !open &&
                                  setQuestionTypeDialog((prev) => ({
                                    ...prev,
                                    open: false,
                                  }))
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openQuestionTypeDialog("reading", passageIndex);
                                    }}
                                  // disabled={
                                  //   testData.reading.passages.reduce(
                                  //     (total, passage) =>
                                  //       total +
                                  //       getQuestionCount(
                                  //         passage.questionBlocks || []
                                  //       ),
                                  //     0
                                  //   ) >= 40
                                  // }
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Question Block
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Select Question Type</DialogTitle>
                                    <DialogDescription>
                                      Choose the type of question block to add to
                                      Passage {passage.part}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid grid-cols-1 gap-2 py-4">
                                    {READING_QUESTION_TYPES.map((type) => (
                                      <Button
                                        key={type.value}
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() =>
                                          handleQuestionTypeSelect(type.value)
                                        }
                                      >
                                        {type.label}
                                      </Button>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {readingPassagesOpen[passage.part] ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {/* Passage question range editor */}
                        <CardContent>
                          <div className="space-y-3">
                            <Label>Passage question range</Label>
                            <Input
                              placeholder="Passage question start"
                              value={passage.questionStart || ""}
                              onChange={(e) => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.reading.passages[
                                    passageIndex
                                  ].questionStart = e.target.value;
                                  return updated;
                                });
                              }}
                            />
                            <Input
                              placeholder="Passage question end"
                              value={passage.questionEnd || ""}
                              onChange={(e) => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.reading.passages[passageIndex].questionEnd =
                                    e.target.value;
                                  return updated;
                                });
                              }}
                            />
                          </div>
                        </CardContent>
                        <CardContent className="space-y-4">
                          {/* Passage Content Editor */}
                          <div className="space-y-3">
                            <Label>Passage Content</Label>
                            <Input
                              placeholder="Passage headline"
                              value={passage.passage.headline || ""}
                              onChange={(e) => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.reading.passages[
                                    passageIndex
                                  ].passage.headline = e.target.value;
                                  return updated;
                                });
                              }}
                            />
                            <Input
                              placeholder="Passage sub-headline (optional)"
                              value={passage.passage.subHeadline || ""}
                              onChange={(e) => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.reading.passages[
                                    passageIndex
                                  ].passage.subHeadline = e.target.value;
                                  return updated;
                                });
                              }}
                            />
                          </div>

                          {/* Paragraphs Management */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-lg font-semibold">
                                Paragraphs
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTestData((prev) => {
                                    const updated = { ...prev };
                                    const nextTag = String.fromCharCode(
                                      65 +
                                      updated.reading.passages[passageIndex].passage
                                        .paragraphs.length
                                    );

                                    // Check if passage has match-heading question type
                                    const hasMatchHeading = updated.reading.passages[
                                      passageIndex
                                    ].questionBlocks.some(
                                      (block) =>
                                        block.type === "match-heading" ||
                                        block.type === "matching-headers"
                                    );

                                    // Find the match-heading block to get the next question number
                                    let nextQuestionNumber: number | undefined =
                                      undefined;
                                    if (hasMatchHeading) {
                                      const matchHeadingBlock =
                                        updated.reading.passages[
                                          passageIndex
                                        ].questionBlocks.find(
                                          (block) =>
                                            block.type === "match-heading" ||
                                            block.type === "matching-headers"
                                        );

                                      // Calculate next question number based on existing paragraphs
                                      const existingParagraphs =
                                        updated.reading.passages[passageIndex].passage
                                          .paragraphs;
                                      const blockStartNum =
                                        matchHeadingBlock?.questionStart
                                          ? typeof matchHeadingBlock.questionStart ===
                                            "number"
                                            ? matchHeadingBlock.questionStart
                                            : parseInt(
                                              matchHeadingBlock.questionStart
                                            )
                                          : 0;
                                      const maxQuestionNumber =
                                        existingParagraphs.reduce(
                                          (max, p) =>
                                            Math.max(max, p.questionNumber || 0),
                                          blockStartNum
                                        );
                                      nextQuestionNumber = maxQuestionNumber + 1;
                                    }

                                    const newParagraph: any = {
                                      header: "",
                                      tag: nextTag,
                                      content: "Enter paragraph content here...",
                                    };

                                    // Add match-heading properties if needed
                                    if (hasMatchHeading) {
                                      newParagraph.droppableArea = true;
                                      newParagraph.questionNumber =
                                        nextQuestionNumber;
                                    }

                                    updated.reading.passages[
                                      passageIndex
                                    ].passage.paragraphs.push(newParagraph);
                                    return updated;
                                  });
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Paragraph
                              </Button>
                            </div>

                            {passage.passage.paragraphs.map(
                              (paragraph, paragraphIndex) => {
                                const paragraphKey = `passage-${passageIndex}-paragraph-${paragraphIndex}`;
                                return (
                                <Card
                                  key={paragraphIndex}
                                  className="rounded-lg border bg-card p-4 shadow-xs"
                                >
                                  <Collapsible open={readingParagraphsOpen[paragraphKey] !== false}>
                                    <div className="flex items-center justify-between pb-2">
                                      <div className="flex items-center gap-2">
                                        <StatusBadge
                                          status="neutral"
                                          label={`Paragraph ${paragraphIndex + 1}`}
                                        />
                                        {paragraph.tag && (
                                          <StatusBadge status="info" label={paragraph.tag} />
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 h-auto"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReadingParagraphsOpen(prev => ({
                                              ...prev,
                                              [paragraphKey]: prev[paragraphKey] === false
                                            }));
                                          }}
                                        >
                                          {readingParagraphsOpen[paragraphKey] !== false ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTestData((prev) => {
                                            const updated = { ...prev };
                                            updated.reading.passages[
                                              passageIndex
                                            ].passage.paragraphs.splice(
                                              paragraphIndex,
                                              1
                                            );
                                            return updated;
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <CollapsibleContent>
                                      <div className="p-4 pt-2 space-y-3">

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label>Header/Title (optional)</Label>
                                        <Input
                                          placeholder="e.g., Introduction, Background..."
                                          value={paragraph.header || ""}
                                          onChange={(e) => {
                                            setTestData((prev) => {
                                              const updated = { ...prev };
                                              updated.reading.passages[
                                                passageIndex
                                              ].passage.paragraphs[
                                                paragraphIndex
                                              ].header = e.target.value;
                                              return updated;
                                            });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label>Tag/Letter (optional)</Label>
                                        <Input
                                          placeholder="e.g., A, B, C..."
                                          value={paragraph.tag || ""}
                                          onChange={(e) => {
                                            setTestData((prev) => {
                                              const updated = { ...prev };
                                              updated.reading.passages[
                                                passageIndex
                                              ].passage.paragraphs[
                                                paragraphIndex
                                              ].tag = e.target.value;
                                              return updated;
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Question Number field - only for match-heading passages */}
                                    {passage.questionBlocks.some(
                                      (block) =>
                                        block.type === "match-heading" ||
                                        block.type === "matching-headers"
                                    ) && (
                                        <div>
                                          <Label>
                                            Question Number{" "}
                                            <span className="text-xs text-muted-foreground">
                                              (for match-heading)
                                            </span>
                                          </Label>
                                          <Input
                                            type="number"
                                            placeholder="e.g., 14, 15, 16..."
                                            value={paragraph.questionNumber || ""}
                                            onChange={(e) => {
                                              setTestData((prev) => {
                                                const updated = { ...prev };
                                                const value = e.target.value;
                                                if (value === "") {
                                                  delete updated.reading.passages[
                                                    passageIndex
                                                  ].passage.paragraphs[paragraphIndex]
                                                    .questionNumber;
                                                } else {
                                                  updated.reading.passages[
                                                    passageIndex
                                                  ].passage.paragraphs[
                                                    paragraphIndex
                                                  ].questionNumber = parseInt(value);
                                                }
                                                return updated;
                                              });
                                            }}
                                          />
                                        </div>
                                      )}

                                    <div>
                                      <Label>Content *</Label>
                                      <Textarea
                                        placeholder="Enter the paragraph content here..."
                                        value={paragraph.content || ""}
                                        onChange={(e) => {
                                          setTestData((prev) => {
                                            const updated = { ...prev };
                                            updated.reading.passages[
                                              passageIndex
                                            ].passage.paragraphs[
                                              paragraphIndex
                                            ].content = e.target.value;
                                            return updated;
                                          });
                                        }}
                                        rows={4}
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </Card>
                              );
                              }
                            )}

                            {passage.passage.paragraphs.length === 0 && (
                              <p className="text-gray-500 text-center py-8">
                                No paragraphs added yet. Click "Add Paragraph" to
                                start.
                              </p>
                            )}
                          </div>

                          {/* Question Blocks */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">Question Blocks</h4>
                            {passage.questionBlocks.map((block, blockIndex) => {
                              const blockKey = `reading-${passageIndex}-${block.id}`;
                              return (
                                <DraggableQuestionBlock
                                  key={blockKey}
                                  block={block}
                                  blockIndex={blockIndex}
                                  section="reading"
                                  partIndex={passageIndex}
                                  isOpen={readingBlocksOpen[blockKey] !== false}
                                  onToggle={() => {
                                    setReadingBlocksOpen(prev => ({
                                      ...prev,
                                      [blockKey]: !prev[blockKey]
                                    }));
                                  }}
                                  onMove={(dragInfo) =>
                                    moveQuestionBlock("reading", dragInfo)
                                  }
                                  onRemove={() =>
                                    removeQuestionBlock(
                                      "reading",
                                      passageIndex,
                                      blockIndex
                                    )
                                  }
                                  renderAdmin={() =>
                                    renderQuestionBlockAdmin(
                                      block,
                                      "reading",
                                      passageIndex,
                                      blockIndex
                                    )
                                  }
                                />
                              );
                            })}
                            {passage.questionBlocks.length === 0 && (
                              <p className="text-gray-500 text-center py-8">
                                No question blocks added yet
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </DndProvider>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Writing Section */}
      <Card>
        <Collapsible open={writingOpen} onOpenChange={setWritingOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle>Writing Section</CardTitle>
                {writingOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {testData.writing.tasks.map((task, taskIndex) => (
                <Card
                  key={task.task}
                  className="rounded-lg border bg-card p-4 shadow-xs"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Task {task.task}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Instructions */}
                    <div className="space-y-3">
                      <Label>Instructions</Label>
                      {task.instructions.map(
                        (instruction, instructionIndex) => (
                          <div key={instructionIndex} className="flex gap-2">
                            <Input
                              value={instruction}
                              onChange={(e) => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.writing.tasks[taskIndex].instructions[
                                    instructionIndex
                                  ] = e.target.value;
                                  return updated;
                                });
                              }}
                              placeholder={`Instruction ${instructionIndex + 1
                                }...`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTestData((prev) => {
                                  const updated = { ...prev };
                                  updated.writing.tasks[
                                    taskIndex
                                  ].instructions.splice(instructionIndex, 1);
                                  return updated;
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTestData((prev) => {
                            const updated = { ...prev };
                            updated.writing.tasks[taskIndex].instructions.push(
                              ""
                            );
                            return updated;
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Instruction
                      </Button>
                    </div>

                    {/* Image Upload (Task 1 only) */}
                    {task.task === "1" && (
                      <div className="space-y-3">
                        <Label>Task Image (Charts, Graphs, etc.)</Label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setTestData((prev) => {
                                    const updated = { ...prev };
                                    updated.writing.tasks[taskIndex].image =
                                      reader.result as string;
                                    return updated;
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Label>Or paste image URL</Label>
                          <Input
                            placeholder="Image URL..."
                            value={task.image || ""}
                            onChange={(e) => {
                              setTestData((prev) => {
                                const updated = { ...prev };
                                updated.writing.tasks[taskIndex].image =
                                  e.target.value;
                                return updated;
                              });
                            }}
                          />
                        </div>
                        {task.image && (
                          <div className="mt-2">
                            <img
                              src={task.image}
                              alt="Task Image Preview"
                              className="max-w-full h-auto border rounded"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Correct Answers Section */}
      <Card>
        <Collapsible
          open={correctAnswersOpen}
          onOpenChange={setCorrectAnswersOpen}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Correct Answers Management
                  <StatusBadge
                    status="info"
                    label={`${correctAnswers.correct_answers.reduce(
                      (total, section) => total + section.answers.length,
                      0
                    )} answers`}
                  />
                </CardTitle>
                {correctAnswersOpen ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <CorrectAnswersManager
                testData={testData}
                correctAnswers={correctAnswers}
                onChange={setCorrectAnswers}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Delete Test Button */}
      <div className="flex justify-center pt-8 border-t">
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="lg" className="px-8">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Test</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this test entirely? This action
                cannot be undone. All test data, including listening parts,
                reading passages, and writing tasks will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteTest}>
                Yes, Delete Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
