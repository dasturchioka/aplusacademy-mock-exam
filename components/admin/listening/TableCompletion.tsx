"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { processTextFormatting } from "@/utils/highlightAsBold";

type TableCell = {
  content: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  colSpan?: number;
  rowSpan?: number;
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableColumn = {
  content: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableRow = {
  name: string;
  cells: TableCell[];
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableRowHeader = {
  name: string;
  isInput?: boolean;
  questionNumber?: string;
  questionNumbers?: string[];
  isGray?: boolean;
  textPlacement?:
    | "center"
    | "right-center"
    | "left-center"
    | "bottom-center"
    | "top-center"
    | "top-right"
    | "left-right"
    | "bottom-left"
    | "bottom-right";
  textAlignment?: "left" | "right" | "center";
};

type TableCompletionQuestion = {
  questionStart: string;
  questionEnd: string;
  type: "table-completion";
  instructions: string[];
  headline: string;
  rowHeader?: TableRowHeader;
  cols: TableColumn[]; // Changed from union type
  rows?: TableRow[];
  answerConstraints: string;
};

type Props = {
  question: TableCompletionQuestion;
  onChange?: (data: TableCompletionQuestion) => void;
};

export default function TableCompletionAdmin({ question, onChange }: Props) {
  const [tableData, setTableData] = useState<TableCompletionQuestion>(question);
  const isSyncingRef = useRef(false);

  // Sync tableData with incoming question prop (for edit mode)
  useEffect(() => {
    isSyncingRef.current = true;
    setTableData(question);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [question]);

  const handleUpdate = (newData: TableCompletionQuestion) => {
    // 🚀 REAL-TIME COMPONENT LOGGING
    // console.log("📊 TableCompletion Component Updated:", {
    //   type: newData.type,
    //   questionRange: `${newData.questionStart}-${newData.questionEnd}`,
    //   headline: newData.headline,
    //   colsCount: newData.cols.length,
    //   rowsCount: newData.rows?.length || 0,
    //   inputCells:
    //     newData.rows?.reduce(
    //       (total, row) =>
    //         total + row.cells.filter((cell) => cell.isInput).length,
    //       0
    //     ) || 0,
    //   fullStructure: newData,
    // });
    setTableData(newData);
    if (!isSyncingRef.current) {
      onChange?.(newData);
    }
  };

  const updateCell = (
    rowIndex: number,
    cellIndex: number,
    updates: Partial<TableCell>
  ) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex].cells[cellIndex] = {
      ...newRows[rowIndex].cells[cellIndex],
      ...updates,
    };
    handleUpdate({ ...tableData, rows: newRows });
  };

  const deleteCell = (rowIndex: number, cellIndex: number) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex].cells.splice(cellIndex, 1);
    handleUpdate({ ...tableData, rows: newRows });
  };

  const addRow = () => {
    const newRows = [
      ...(tableData.rows || []),
      { name: `Row ${(tableData.rows?.length || 0) + 1}`, cells: [] },
    ];
    handleUpdate({ ...tableData, rows: newRows });
  };

  const addCol = () => {
    const newCols: TableColumn[] = [
      ...tableData.cols,
      { content: `Column ${tableData.cols.length + 1}` }, // Now returns TableColumn object
    ];
    const newRows =
      tableData.rows?.map((row) => ({
        ...row,
        cells: [...row.cells, { content: "" }],
      })) || [];
    handleUpdate({ ...tableData, cols: newCols, rows: newRows });
  };

  const deleteCol = (colIndex: number) => {
    const newCols = [...tableData.cols];
    newCols.splice(colIndex, 1);
    const newRows =
      tableData.rows?.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== colIndex),
      })) || [];
    handleUpdate({ ...tableData, cols: newCols, rows: newRows });
  };

  const deleteRow = (rowIndex: number) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows.splice(rowIndex, 1);
    handleUpdate({
      ...tableData,
      rows: newRows.length > 0 ? newRows : undefined,
    });
  };

  const addCellToRow = (rowIndex: number) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex].cells.push({ content: "" });
    handleUpdate({ ...tableData, rows: newRows });
  };

  const updateRowName = (rowIndex: number, name: string) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex].name = name;
    handleUpdate({ ...tableData, rows: newRows });
  };

  const updateRowProperties = (
    rowIndex: number,
    updates: Partial<TableRow>
  ) => {
    if (!tableData.rows) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], ...updates };
    handleUpdate({ ...tableData, rows: newRows });
  };

  const updateColContent = (colIndex: number, content: string) => {
    const newCols = [...tableData.cols];
    newCols[colIndex] = { ...newCols[colIndex], content };
    handleUpdate({ ...tableData, cols: newCols });
  };

  const updateColProperties = (
    colIndex: number,
    updates: Partial<TableColumn>
  ) => {
    const newCols = [...tableData.cols];
    newCols[colIndex] = { ...newCols[colIndex], ...updates };
    handleUpdate({ ...tableData, cols: newCols });
  };

  const toggleRowsVisibility = () => {
    if (tableData.rows) {
      // Remove rows
      handleUpdate({ ...tableData, rows: undefined, rowHeader: undefined });
    } else {
      // Add rows
      handleUpdate({
        ...tableData,
        rows: [
          {
            name: "Row 1",
            cells: Array(tableData.cols.length).fill({ content: "" }),
          },
        ],
      });
    }
  };

  const addQuestionNumber = (rowIndex: number, cellIndex: number) => {
    if (!tableData.rows) return;
    const cell = tableData.rows[rowIndex].cells[cellIndex];
    const currentNumbers = cell.questionNumbers || [];
    const newNumbers = [...currentNumbers, ""];
    updateCell(rowIndex, cellIndex, { questionNumbers: newNumbers });
  };

  const updateQuestionNumber = (
    rowIndex: number,
    cellIndex: number,
    qIndex: number,
    value: string
  ) => {
    if (!tableData.rows) return;
    const cell = tableData.rows[rowIndex].cells[cellIndex];
    const currentNumbers = cell.questionNumbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[qIndex] = value;
    updateCell(rowIndex, cellIndex, { questionNumbers: newNumbers });
  };

  const removeQuestionNumber = (
    rowIndex: number,
    cellIndex: number,
    qIndex: number
  ) => {
    if (!tableData.rows) return;
    const cell = tableData.rows[rowIndex].cells[cellIndex];
    const currentNumbers = cell.questionNumbers || [];
    const newNumbers = currentNumbers.filter((_, i) => i !== qIndex);
    updateCell(rowIndex, cellIndex, {
      questionNumbers: newNumbers.length > 0 ? newNumbers : [],
    });
  };

  const addRowQuestionNumber = (rowIndex: number) => {
    if (!tableData.rows) return;
    const row = tableData.rows[rowIndex];
    const currentNumbers = row.questionNumbers || [];
    const newNumbers = [...currentNumbers, ""];
    updateRowProperties(rowIndex, { questionNumbers: newNumbers });
  };

  const addRowHeaderQuestionNumber = () => {
    if (!tableData.rows && !tableData.rowHeader) return;
    const rowHeader = tableData.rowHeader;
    const currentNumbers = rowHeader?.questionNumbers || [];
    const newNumbers = [...currentNumbers, ""];
    updateRowHeaderProperties({ questionNumbers: newNumbers });
  };

  const addRowHeader = () => {
    if (tableData.rowHeader) return;

    const newRowHeader: TableRowHeader = {
      name: "",
      isInput: false,
      questionNumber: "", // Changed from undefined to ""
      questionNumbers: [],
      isGray: false,
      textPlacement: "center",
      textAlignment: "left",
    };

    handleUpdate({ ...tableData, rowHeader: newRowHeader });
  };

  const updateRowQuestionNumber = (
    rowIndex: number,
    qIndex: number,
    value: string
  ) => {
    if (!tableData.rows) return;
    const row = tableData.rows[rowIndex];
    const currentNumbers = row.questionNumbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[qIndex] = value;
    updateRowProperties(rowIndex, { questionNumbers: newNumbers });
  };

  const updateRowHeaderQuestionNumer = (qIndex: number, value: string) => {
    if (!tableData.rowHeader) return;
    const currentNumbers = tableData.rowHeader.questionNumbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[qIndex] = value;
    updateRowHeaderProperties({ questionNumbers: newNumbers });
  };

  const removeRowQuestionNumber = (rowIndex: number, qIndex: number) => {
    if (!tableData.rows) return;
    const row = tableData.rows[rowIndex];
    const currentNumbers = row.questionNumbers || [];
    const newNumbers = currentNumbers.filter((_, i) => i !== qIndex);
    updateRowProperties(rowIndex, {
      questionNumbers: newNumbers.length > 0 ? newNumbers : [],
    });
  };

  const removeRowHeaderQuestionNumber = (qIndex: number) => {
    if (!tableData.rows && !tableData.rowHeader) return;
    const rowHeader = tableData.rowHeader;
    const currentNumbers = rowHeader?.questionNumbers || [];
    const newNumbers = currentNumbers.filter((_, i) => i !== qIndex);
    updateRowHeaderProperties({
      questionNumbers: newNumbers.length > 0 ? newNumbers : [],
    });
  };

  const addColQuestionNumber = (colIndex: number) => {
    const col = tableData.cols[colIndex];
    const currentNumbers =
      typeof col === "string" ? [] : col.questionNumbers || [];
    const newNumbers = [...currentNumbers, ""];
    updateColProperties(colIndex, { questionNumbers: newNumbers });
  };

  const updateColQuestionNumber = (
    colIndex: number,
    qIndex: number,
    value: string
  ) => {
    const col = tableData.cols[colIndex];
    const currentNumbers =
      typeof col === "string" ? [] : col.questionNumbers || [];
    const newNumbers = [...currentNumbers];
    newNumbers[qIndex] = value;
    updateColProperties(colIndex, { questionNumbers: newNumbers });
  };

  const removeColQuestionNumber = (colIndex: number, qIndex: number) => {
    const col = tableData.cols[colIndex];
    const currentNumbers =
      typeof col === "string" ? [] : col.questionNumbers || [];
    const newNumbers = currentNumbers.filter((_, i) => i !== qIndex);
    updateColProperties(colIndex, {
      questionNumbers: newNumbers.length > 0 ? newNumbers : [],
    });
  };

  const addInstruction = () => {
    const newInstructions = [...tableData.instructions, ""];
    handleUpdate({ ...tableData, instructions: newInstructions });
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...tableData.instructions];
    newInstructions[index] = value;
    handleUpdate({ ...tableData, instructions: newInstructions });
  };

  const deleteInstruction = (index: number) => {
    const newInstructions = tableData.instructions.filter(
      (_, i) => i !== index
    );
    handleUpdate({ ...tableData, instructions: newInstructions });
  };

  const updateRowHeaderName = (value: string) => {
    handleUpdate({
      ...tableData,
      rowHeader: { ...tableData.rowHeader, name: value },
    });
  };

  const deleteRowHeader = () => {
    handleUpdate({ ...tableData, rowHeader: undefined });
  };

  const updateRowHeaderProperties = (updates: Partial<TableRowHeader>) => {
    if (!tableData.rowHeader) return;
    handleUpdate({
      ...tableData,
      rowHeader: { ...tableData.rowHeader, ...updates },
    });
  };

  const renderQuestionNumbersEditor = (
    rowIndex: number,
    cellIndex: number,
    cell: TableCell
  ) => {
    if (!cell.isInput) return null;

    const questionNumbers = cell.questionNumbers || [];
    const hasMultipleQuestions = questionNumbers.length > 1;

    return (
      <div className="space-y-2">
        {/* Legacy single question number support */}
        {!hasMultipleQuestions && (
          <Input
            placeholder="Question #"
            value={cell.questionNumber || ""} // Ensure it's always a string
            onChange={(e) =>
              updateCell(rowIndex, cellIndex, {
                questionNumber: e.target.value,
              })
            }
          />
        )}
        {/* Multiple question numbers */}
        {questionNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Question Numbers:</p>
            {questionNumbers.map((qNum, qIndex) => (
              <div key={qIndex} className="flex gap-1">
                <Input
                  placeholder={`Question ${qIndex + 1}`}
                  value={qNum}
                  onChange={(e) =>
                    updateQuestionNumber(
                      rowIndex,
                      cellIndex,
                      qIndex,
                      e.target.value
                    )
                  }
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() =>
                    removeQuestionNumber(rowIndex, cellIndex, qIndex)
                  }
                >
                  <Trash size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => addQuestionNumber(rowIndex, cellIndex)}
          className="text-xs"
        >
          <Plus size={12} className="mr-1" />
          Add Question #
        </Button>
      </div>
    );
  };

  const renderRowHeaderQuestionNumbersEditor = () => {
    if (!tableData.rowHeader?.isInput) return null;

    const questionNumbers = tableData.rowHeader.questionNumbers || [];
    const hasMultipleQuestions = questionNumbers.length >= 1;

    return (
      <div className="space-y-2 mt-2">
        {/* Legacy single question number support */}
        {!hasMultipleQuestions && (
          <Input
            placeholder="Row Question #"
            value={tableData.rowHeader.questionNumber || ""} // Ensure it's always a string
            onChange={(e) =>
              updateRowHeaderProperties({ questionNumber: e.target.value })
            }
            className="text-sm"
          />
        )}

        {/* Multiple question numbers */}
        {questionNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Row Question Numbers:</p>
            {questionNumbers.map((qNum, qIndex) => (
              <div key={qIndex} className="flex gap-1">
                <Input
                  placeholder={`Question ${qIndex + 1}`}
                  value={qNum}
                  onChange={(e) =>
                    updateRowHeaderQuestionNumer(qIndex, e.target.value)
                  }
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => removeRowHeaderQuestionNumber(qIndex)}
                >
                  <Trash size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => addRowHeaderQuestionNumber()}
          className="text-xs"
        >
          <Plus size={12} className="mr-1" />
          Add Row Question #
        </Button>
      </div>
    );
  };

  const renderRowQuestionNumbersEditor = (rowIndex: number, row: TableRow) => {
    if (!row.isInput) return null;

    const questionNumbers = row.questionNumbers || [];
    const hasMultipleQuestions = questionNumbers.length > 1;

    return (
      <div className="space-y-2 mt-2">
        {/* Legacy single question number support */}
        {!hasMultipleQuestions && (
          <Input
            placeholder="Row Question #"
            value={row.questionNumber || ""} // Ensure it's always a string
            onChange={(e) =>
              updateRowProperties(rowIndex, { questionNumber: e.target.value })
            }
            className="text-sm"
          />
        )}

        {/* Multiple question numbers */}
        {questionNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Row Question Numbers:</p>
            {questionNumbers.map((qNum, qIndex) => (
              <div key={qIndex} className="flex gap-1">
                <Input
                  placeholder={`Question ${qIndex + 1}`}
                  value={qNum}
                  onChange={(e) =>
                    updateRowQuestionNumber(rowIndex, qIndex, e.target.value)
                  }
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => removeRowQuestionNumber(rowIndex, qIndex)}
                >
                  <Trash size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => addRowQuestionNumber(rowIndex)}
          className="text-xs"
        >
          <Plus size={12} className="mr-1" />
          Add Row Question #
        </Button>
      </div>
    );
  };

  // const renderRowHeaderQuestionNumbersEditor = () => {
  //   if (!tableData.rowHeader) return null;

  //   const questionNumbers = tableData.rowHeader.questionNumbers || [];
  //   const hasMultipleQuestions = questionNumbers.length > 1;

  //   return (
  //     <div className="space-y-2 mt-2">
  //       {/* Legacy single question number support */}
  //       {!hasMultipleQuestions && (
  //         <Input
  //           placeholder="Row Question #"
  //           value={tableData.rowHeader.questionNumber ?? ""}
  //           onChange={(e) =>
  //             updateRowHeaderProperties({ questionNumber: e.target.value })
  //           }
  //           className="text-sm"
  //         />
  //       )}

  //       {/* Multiple question numbers */}
  //       {questionNumbers.length > 0 && (
  //         <div className="space-y-1">
  //           <p className="text-xs text-gray-600">Row Question Numbers:</p>
  //           {questionNumbers.map((qNum, qIndex) => (
  //             <div key={qIndex} className="flex gap-1">
  //               <Input
  //                 placeholder={`Question ${qIndex + 1}`}
  //                 value={qNum}
  //                 onChange={(e) =>
  //                   updateRowHeaderQuestionNumer(qIndex, e.target.value)
  //                 }
  //                 className="text-sm"
  //               />
  //               <Button
  //                 variant="ghost"
  //                 size="icon"
  //                 className="h-8 w-8 text-red-500"
  //                 onClick={() => removeRowHeaderQuestionNumber(qIndex)}
  //               >
  //                 <Trash size={12} />
  //               </Button>
  //             </div>
  //           ))}
  //         </div>
  //       )}

  //       <Button
  //         variant="outline"
  //         size="sm"
  //         onClick={() => addRowHeaderQuestionNumber()}
  //         className="text-xs"
  //       >
  //         <Plus size={12} className="mr-1" />
  //         Add Row Question #
  //       </Button>
  //     </div>
  //   );
  // };

  const renderColQuestionNumbersEditor = (
    colIndex: number,
    col: TableColumn
  ) => {
    if (!col.isInput) return null;

    const questionNumbers = col.questionNumbers || [];
    const hasMultipleQuestions = questionNumbers.length > 1;

    return (
      <div className="space-y-2 mt-2">
        {/* Legacy single question number support */}
        {!hasMultipleQuestions && (
          <Input
            placeholder="Col Question #"
            value={col.questionNumber || ""} // Ensure it's always a string
            onChange={(e) =>
              updateColProperties(colIndex, { questionNumber: e.target.value })
            }
            className="text-sm"
          />
        )}

        {/* Multiple question numbers */}
        {questionNumbers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Col Question Numbers:</p>
            {questionNumbers.map((qNum, qIndex) => (
              <div key={qIndex} className="flex gap-1">
                <Input
                  placeholder={`Question ${qIndex + 1}`}
                  value={qNum}
                  onChange={(e) =>
                    updateColQuestionNumber(colIndex, qIndex, e.target.value)
                  }
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => removeColQuestionNumber(colIndex, qIndex)}
                >
                  <Trash size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => addColQuestionNumber(colIndex)}
          className="text-xs"
        >
          <Plus size={12} className="mr-1" />
          Add Col Question #
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Table Completion Admin</h2>

      <div className="bg-blue-50 p-3 rounded text-sm">
        <p>
          <strong>Usage Tips:</strong>
        </p>
        <p>
          • Use <code>-_-_</code> for bullet points
        </p>
        <p>
          • Use <code>____</code> for input placeholders
        </p>
        <p>
          • Enable "Is input" and add question numbers for interactive fields
        </p>
        <p>
          • For multiple questions in one cell/row/column, add multiple question
          numbers
        </p>
        <p>
          • Rows are optional - you can create table structures with just
          columns and cells
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium">Instructions:</p>
          <Button
            variant="outline"
            size="sm"
            onClick={addInstruction}
            className="text-xs"
          >
            <Plus size={14} className="mr-1" />
            Add Instruction
          </Button>
        </div>
        {tableData.instructions.map((inst, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={inst}
              onChange={(e) => updateInstruction(i, e.target.value)}
              placeholder={`Instruction ${i + 1}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteInstruction(i)}
              className="text-red-500 flex-shrink-0"
            >
              <Trash size={16} />
            </Button>
          </div>
        ))}
        <div>
          <p className="font-medium mb-2">Answer Constraints:</p>
          <Input
            value={tableData.answerConstraints}
            onChange={(e) => {
              const newAnswerConstraints = e.target.value;
              handleUpdate({
                ...tableData,
                answerConstraints: newAnswerConstraints,
              });
            }}
            placeholder="Answer constraints (e.g., ONE WORD AND/OR A NUMBER)"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="font-medium mb-2">Question Start:</p>
          <Input
            value={tableData.questionStart}
            onChange={(e) =>
              handleUpdate({ ...tableData, questionStart: e.target.value })
            }
            placeholder="e.g. 1"
          />
        </div>
        <div>
          <p className="font-medium mb-2">Question End:</p>
          <Input
            value={tableData.questionEnd}
            onChange={(e) =>
              handleUpdate({ ...tableData, questionEnd: e.target.value })
            }
            placeholder="e.g. 10"
          />
        </div>
      </div>

      <div>
        <p className="font-medium mb-2">Headline:</p>
        <Input
          value={tableData.headline}
          onChange={(e) =>
            handleUpdate({ ...tableData, headline: e.target.value })
          }
        />
      </div>

      <div className="overflow-auto border rounded">
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr>
              {tableData.rowHeader ? (
                <th
                  style={{
                    background: tableData.rowHeader.isGray
                      ? "#F9FAFB"
                      : "white",
                    fontWeight: "normal",
                  }}
                  className="border p-2 text-left"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={tableData.rowHeader?.name}
                        onChange={(e) => updateRowHeaderName(e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRowHeader()}
                        className="text-red-500"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tableData.rowHeader?.isInput || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateRowHeaderProperties({ isInput: true });
                          } else {
                            updateRowHeaderProperties({
                              isInput: false,
                              questionNumber: undefined,
                              questionNumbers: undefined,
                            });
                          }
                        }}
                      />
                      <span className="text-sm">Is input</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tableData.rowHeader?.isGray}
                        onCheckedChange={(checked) =>
                          updateRowHeaderProperties({ isGray: !!checked })
                        }
                      />
                      <span className="text-sm">Is gray</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Text Placement:</p>
                      <select
                        value={tableData.rowHeader?.textPlacement || "center"}
                        onChange={(e) =>
                          updateRowHeaderProperties({
                            textPlacement: e.target
                              .value as TableRowHeader["textPlacement"],
                          })
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="center">Center</option>
                        <option value="right-center">Right Center</option>
                        <option value="left-center">Left Center</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="left-right">Left Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Text Alignment:</p>
                      <select
                        value={tableData.rowHeader?.textAlignment || "left"}
                        onChange={(e) =>
                          updateRowHeaderProperties({
                            textAlignment: e.target
                              .value as TableRowHeader["textAlignment"],
                          })
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    {renderRowHeaderQuestionNumbersEditor()}
                  </div>
                </th>
              ) : (
                <th className="border p-2 text-left">
                  <Button onClick={addRowHeader}>Add row header</Button>
                </th>
              )}
              {tableData.cols.map((col, i) => (
                <th
                  key={i}
                  style={{
                    background: col.isGray ? "#F9FAFB" : "white",
                    fontWeight: "normal",
                  }}
                  className="border p-2 text-left"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={col.content}
                        onChange={(e) => updateColContent(i, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCol(i)}
                        className="text-red-500"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={col.isInput || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateColProperties(i, { isInput: true });
                          } else {
                            updateColProperties(i, {
                              isInput: false,
                              questionNumber: undefined,
                              questionNumbers: undefined,
                            });
                          }
                        }}
                      />
                      <span className="text-sm">Is input</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={col.isGray}
                        onCheckedChange={(checked) =>
                          updateColProperties(i, { isGray: !!checked })
                        }
                      />
                      <span className="text-sm">Is gray</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Text Placement:</p>
                      <select
                        value={col.textPlacement || "center"}
                        onChange={(e) =>
                          updateColProperties(i, {
                            textPlacement: e.target
                              .value as TableColumn["textPlacement"],
                          })
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="center">Center</option>
                        <option value="right-center">Right Center</option>
                        <option value="left-center">Left Center</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="left-right">Left Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Text Alignment:</p>
                      <select
                        value={col.textAlignment || "left"}
                        onChange={(e) =>
                          updateColProperties(i, {
                            textAlignment: e.target
                              .value as TableColumn["textAlignment"],
                          })
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    {renderColQuestionNumbersEditor(i, col)}
                  </div>
                </th>
              ))}
              <th className="p-2"></th>
            </tr>
          </thead>
          {tableData.rows && (
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th
                    style={{
                      background: row.isGray ? "#F9FAFB" : "#fff",
                      fontWeight: "normal",
                    }}
                    className="border p-2 text-left"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={row.name}
                          onChange={(e) =>
                            updateRowName(rowIndex, e.target.value)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRow(rowIndex)}
                          className="text-red-500"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={row.isInput || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateRowProperties(rowIndex, { isInput: true });
                            } else {
                              updateRowProperties(rowIndex, {
                                isInput: false,
                                questionNumber: undefined,
                                questionNumbers: undefined,
                              });
                            }
                          }}
                        />
                        <span className="text-sm">Is input</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={row.isGray}
                          onCheckedChange={(checked) =>
                            updateRowProperties(rowIndex, { isGray: !!checked })
                          }
                        />
                        <span className="text-sm">Is gray</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Text Placement:</p>
                        <select
                          value={row.textPlacement || "center"}
                          onChange={(e) =>
                            updateRowProperties(rowIndex, {
                              textPlacement: e.target
                                .value as TableRow["textPlacement"],
                            })
                          }
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="center">Center</option>
                          <option value="right-center">Right Center</option>
                          <option value="left-center">Left Center</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="left-right">Left Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Text Alignment:</p>
                        <select
                          value={row.textAlignment || "left"}
                          onChange={(e) =>
                            updateRowProperties(rowIndex, {
                              textAlignment: e.target
                                .value as TableRow["textAlignment"],
                            })
                          }
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>

                      {renderRowQuestionNumbersEditor(rowIndex, row)}
                    </div>
                  </th>

                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{
                        background: cell.isGray ? "#F9FAFB" : "white",
                      }}
                      className="border p-2 align-top"
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                    >
                      <div className="flex flex-col gap-2">
                        <textarea
                          placeholder="Content (use -_-_ for bullets, ____ for inputs, **text** for bold, Enter for new lines)"
                          value={cell.content}
                          onChange={(e) =>
                            updateCell(rowIndex, cellIndex, {
                              content: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded text-sm resize-y min-h-20"
                        />

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={cell.isInput || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateCell(rowIndex, cellIndex, {
                                  isInput: true,
                                });
                              } else {
                                updateCell(rowIndex, cellIndex, {
                                  isInput: false,
                                  questionNumber: undefined,
                                  questionNumbers: undefined,
                                });
                              }
                            }}
                          />
                          <span className="text-sm">Is input</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={cell.isGray}
                            onCheckedChange={(checked) =>
                              updateCell(rowIndex, cellIndex, {
                                isGray: !!checked,
                              })
                            }
                          />
                          <span className="text-sm">Is gray</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600">
                            Text Placement:
                          </p>
                          <select
                            value={cell.textPlacement || "center"}
                            onChange={(e) =>
                              updateCell(rowIndex, cellIndex, {
                                textPlacement: e.target
                                  .value as TableCell["textPlacement"],
                              })
                            }
                            className="w-full p-2 border rounded text-sm"
                          >
                            <option value="center">Center</option>
                            <option value="right-center">Right Center</option>
                            <option value="left-center">Left Center</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="left-right">Left Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600">
                            Text Alignment:
                          </p>
                          <select
                            value={cell.textAlignment || "left"}
                            onChange={(e) =>
                              updateCell(rowIndex, cellIndex, {
                                textAlignment: e.target
                                  .value as TableCell["textAlignment"],
                              })
                            }
                            className="w-full p-2 border rounded text-sm"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        {renderQuestionNumbersEditor(rowIndex, cellIndex, cell)}

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Colspan"
                            value={cell.colSpan ?? ""}
                            onChange={(e) =>
                              updateCell(rowIndex, cellIndex, {
                                colSpan: e.target.value
                                  ? parseInt(e.target.value)
                                  : 0,
                              })
                            }
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Rowspan"
                            value={cell.rowSpan ?? ""}
                            onChange={(e) =>
                              updateCell(rowIndex, cellIndex, {
                                rowSpan: e.target.value
                                  ? parseInt(e.target.value)
                                  : 0,
                              })
                            }
                            className="text-sm"
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500"
                          onClick={() => deleteCell(rowIndex, cellIndex)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  ))}
                  <td className="p-2 align-top">
                    <Button size="sm" onClick={() => addCellToRow(rowIndex)}>
                      + Cell
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <div className="flex gap-4 mt-4">
        {tableData.rows && <Button onClick={addRow}>+ Add Row</Button>}
        <Button onClick={addCol}>+ Add Column</Button>
      </div>
    </div>
  );
}
