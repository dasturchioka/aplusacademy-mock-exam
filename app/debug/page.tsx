"use client";
import React from "react";
import MultipleChoiceAdmin from "@/components/admin/listening/MultipleChoice";
import MultipleChoiceExam from "@/components/exam/listening/MultipleChoice";
import MatchingAdmin from "@/components/admin/listening/Matching";
import MatchingExam from "@/components/exam/listening/Matching";
import FormCompletionAdmin from "@/components/admin/listening/FormCompletion";
import FormCompletionExam from "@/components/exam/listening/FormCompletion";
import { MapLabellingAdmin } from "@/components/admin/listening/MapLabelling";
import { MapLabellingExam } from "@/components/exam/listening/MapLabelling";
import MultipleSelectAdmin from "@/components/admin/listening/MultipleSelect";
import MultipleSelectExam from "@/components/exam/listening/MultipleSelect";
import TableCompletionAdmin from "@/components/admin/listening/TableCompletion";
import TableCompletionExam from "@/components/exam/listening/TableCompletion";
import DiagramLabellingAdmin from "@/components/admin/listening/DiagramLabelling";
import DiagramLabellingExam from "@/components/exam/listening/DiagramLabelling";
import FlowChartAdmin from "@/components/admin/listening/FlowChart";
import { FlowChartExam } from "@/components/exam/listening/FlowChart";

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="multiple-choice">
        <h1 className="font-bold text-5xl">Listening</h1>
        <h2 className="font-bold text-2xl my-4">Multiple choice</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <MultipleChoiceAdmin
          onChange={(q) => console.log(q)}
          question={{
            id: "",
            inputType: "radio",
            answerConstraints: "CHOOSE ONE WORD ONLY",
            instructions: ["Blah blah", "blah blah"],
            questionStart: "11",
            questionEnd: "20",
            type: "multiple-choice",
            questions: [
              {
                questionNumber: "11",
                questionId: "listening-1-11",
                questionText: "Hello there motherfucker",
                answer: { accepted: [""], correct: "A" },
                options: [{ isInteractive: true, text: "Wow", variant: "A" }],
              },
            ],
            isInteractive: true,
          }}
        />

        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <MultipleChoiceExam
          onAnswerChange={(answers) => console.log(answers)}
          question={{
            inputType: "radio",
            answerConstraints: "CHOOSE ONE WORD ONLY",
            instructions: ["Blah blah", "blah blah"],
            questionStart: "11",
            questionEnd: "20",
            type: "multiple-choice",
            questions: [
              {
                questionId: "listening-1-11",
                questionText: "Hello there motherfucker",
                questionNumber: "11",
                answer: { accepted: [""], correct: "A" },
                options: [
                  { isInteractive: true, text: "Wow", variant: "A" },
                  { isInteractive: true, text: "Wow2", variant: "B" },
                ],
              },
            ],
            isInteractive: true,
          }}
        />
      </div>
      <div className="matching">
        <h2 className="font-bold text-2xl my-4">Matching</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <MatchingAdmin
          onChange={(data: any) => console.log(data)}
          data={{
            questions: [],
            id: "",
            isInteractive: true,
            questionStart: "21",
            questionEnd: "23",
            type: "matching",
            instructions: ["Instructions"],
            pairs: [
              {
                number: "21",
                item: "Anna",
                match: "Mountain hiking",
                isInteractive: true,
              },
              {
                number: "22",
                item: "Ben",
                match: "City tour",
                isInteractive: true,
              },
              {
                number: "23",
                item: "Clara",
                match: "Museum visit",
                isInteractive: true,
              },
            ],
            answerConstraints: "You may use each option once only.",
            options: [
              { label: "A", text: "City tour" },
              { label: "B", text: "Mountain hiking" },
              { label: "C", text: "Museum visit" },
              { label: "D", text: "Beach day" },
            ],
          }}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <MatchingExam
          userAnswers={{}}
          onAnswerChange={(answers) => console.log(answers)}
          data={{
            optionsHeadline: "List of something",
            questionStart: "21",
            questionEnd: "23",
            instructions: ["Instructions"],
            pairs: [
              {
                number: "21",
                item: "Anna",
                match: "Mountain hiking",
                isInteractive: true,
              },
              {
                number: "22",
                item: "Ben",
                match: "City tour",
                isInteractive: true,
              },
              {
                number: "23",
                item: "Clara",
                match: "Museum visit",
                isInteractive: true,
              },
            ],
            options: [
              { label: "A", text: "City tour" },
              { label: "B", text: "Mountain hiking" },
              { label: "C", text: "Museum visit" },
              { label: "D", text: "Beach day" },
            ],
            optionsAtATime: "2",
          }}
        />
      </div>
      <div className="form-completion">
        <h2 className="font-bold text-2xl my-4">Form Completion</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <FormCompletionAdmin
          question={{
            questionStart: "1",
            questionEnd: "10",
            type: "form-fill",
            instructions: ["Fill the form"],
            answerConstraints: "ONE WORD AND/OR A NUMBER",
            isInteractive: true,
            questions: [
              {
                questionId: "listening-1-1",
                questionNumber: "1",
                text: "This is amazing and ____ field",
                isInteractive: true,
              },
              {
                text: "Wow",
                isInteractive: false,
              },
            ],
          }}
          onChange={(updated) => console.log(updated)}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <FormCompletionExam
          onAnswer={(answers) => console.log(answers)}
          question={{
            type: "form-fill",
            questionStart: "8",
            questionEnd: "10",
            headline: "This is a test headline",
            instructions: [
              "Complete the notes below.",
              "Write ONE WORD AND/OR A NUMBER for each answer.",
            ],
            answerConstraints: "ONE WORD AND/OR A NUMBER",
            questions: [
              {
                questionId:
                  "65310260-74e3-433f-a864-327f0f8380e2-1754777363263",
                questionNumber: "8",
                text: "-_-_ June *bold text*  ____",
                isInteractive: true,
              },
              {
                text: "at ____ a.m.",
                isInteractive: true,
                questionNumber: "9",
                questionId: "asdasdqwqeqwe",
              },
              {
                text: "Stamford Properties, 61 Oxford Road, Stamford, ____",
                isInteractive: true,
                questionNumber: "10",
                questionId: "bbvcfgh",
              },
              {
                text: "Park outside",
                isInteractive: false,
              },
            ],
          }}
        />
      </div>
      <div className="map-labelling">
        <h2 className="font-bold text-2xl my-4">Map labelling</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <MapLabellingAdmin
          onChange={(block) => console.log(block)}
          questionBlock={{
            questionStart: "16",
            questionEnd: "20",
            type: "map-labelling",
            instructions: [
              "Label the map below",
              "Write the correct letter, A-H, next to Questions 16-20",
            ],
            image: {
              headline: "Farley House ",
              url: "https://www.ieltsjacky.com/images/xMapGranfordJustMap.jpg.pagespeed.ic.FhFktnjBfA.jpg",
            },
            questions: [
              {
                number: "16",
                text: "Farm shop ____",
                questionId: "",
                questionNumber: 16,
              },
              {
                number: "17",
                text: "Disabled entry ____",
                questionId: "",
                questionNumber: 17,
              },
              {
                number: "18",
                text: "Adventure playground ____",
                questionId: "",
                questionNumber: 18,
              },
              {
                number: "19",
                text: "Kitchen gardens ____",
                questionId: "",
                questionNumber: 19,
              },
              {
                number: "20",
                text: "The Temple of the Four Winds ____",
                questionId: "",
                questionNumber: 20,
              },
            ],
            labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
          }}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <MapLabellingExam
          onAnswer={(answers) => console.log(answers)}
          questionBlock={{
            questionStart: "16",
            questionEnd: "20",
            type: "map-labelling",
            instructions: [
              "Label the map below",
              "Write the correct letter, A-H, next to Questions 16-20",
            ],
            image: {
              headline: "Farley House ",
              url: "https://www.ieltsjacky.com/images/xMapGranfordJustMap.jpg.pagespeed.ic.FhFktnjBfA.jpg",
            },
            questions: [
              {
                number: "16",
                text: "Farm shop ____",
                questionId: "",
                questionNumber: 16,
              },
              {
                number: "17",
                text: "Disabled entry ____",
                questionId: "",
                questionNumber: 17,
              },
              {
                number: "18",
                text: "Adventure playground ____",
                questionId: "",
                questionNumber: 18,
              },
              {
                number: "19",
                text: "Kitchen gardens ____",
                questionId: "",
                questionNumber: 19,
              },
              {
                number: "20",
                text: "The Temple of the Four Winds ____",
                questionId: "",
                questionNumber: 20,
              },
            ],
            labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
          }}
        />
      </div>
      <div className="multiple-select">
        <h2 className="font-bold text-2xl my-4">Multiple select</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <MultipleSelectAdmin
          onChange={(data) => console.log(data)}
          data={{
            questionText: "",
            id: "",
            questionId: "",
            questionStart: "21",
            questionEnd: "22",
            type: "multiple-select",

            instructions: ["Choose TWO letters, A-E"],
            choices: [
              {
                variant: "A",
                text: "receiving support from local restaurants",
              },
              {
                variant: "B",
                text: "finding a good way to prevent waste",
              },
              {
                variant: "C",
                text: "overcoming problems in a basic progress",
              },
              {
                variant: "D",
                text: "experiementing with designs and colours",
              },
              {
                variant: "E",
                text: "learning how to apply 3-D printing",
              },
            ],
          }}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <MultipleSelectExam
          onAnswerChange={(selected) => console.log(selected)}
          data={{
            questionStart: "18",
            questionEnd: "20",
            questionText:
              "Which THREE of the following features of the area in Spain does the speaker talk about?",
            instructions: ["Choose THREE letters, A-G."],
            choices: [
              {
                variant: "A",
                text: "altitude",
              },
              {
                variant: "B",
                text: "coastline",
              },
              {
                variant: "C",
                text: "economy",
              },
              {
                variant: "D",
                text: "temperatures",
              },
              {
                variant: "E",
                text: "vegetation",
              },
              {
                variant: "F",
                text: "wildlife",
              },
            ],
            type: "multiple-select",
          }}
        />
      </div>
      <div className="table-completion">
        <h2 className="font-bold text-2xl my-4">Table completion</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <TableCompletionAdmin
          question={{
            answerConstraints: "ONE WORD ONLY",
            questionStart: "6",
            questionEnd: "10",
            type: "table-completion",
            instructions: [
              "Complete the table below.",
              "Write ONE WORD ONLY for each answer.",
            ],
            headline: "Insurance Benefits",
            cols: ["Insurance Benefits", "Maximum Amount"],
            rows: [
              {
                cells: [
                  { content: "Cancellation" },
                  {
                    content: "£ ____",
                    isInput: true,
                    questionNumber: "6",
                  },
                ],
                name: "",
              },
              {
                cells: [
                  { content: "Hospital" },
                  {
                    content:
                      "£600. Additional benefit allows a ____ to travel to resort",
                    isInput: true,
                    questionNumber: "7",
                  },
                ],
                name: "",
              },
              {
                cells: [
                  {
                    content: "____ departure",
                    isInput: true,
                    questionNumber: "8",
                  },
                  { content: "Up to £1000. Depends on reason" },
                ],
                name: "",
              },
              {
                cells: [
                  { content: "Personal belongings" },
                  {
                    content: "Up to £3000; £500 for one ____",
                    isInput: true,
                    questionNumber: "9",
                  },
                ],
                name: "",
              },
              {
                cells: [
                  {
                    content: "Name of Assistant Manager: Ben ____",
                    isInput: true,
                    questionNumber: "10",
                    colSpan: 2,
                  },
                ],
                name: "",
              },
            ],
          }}
          onChange={(updated) => console.log(updated)}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <TableCompletionExam
          question={{
            questionStart: "36",
            questionEnd: "40",
            type: "table-completion",
            instructions: [
              "Complete the table below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
            ],
            headline: "",
            rowHeader: {
              name: "____ innovations",
              cells: [
                {
                  content:
                    "Developing new approaches to meeting needs of existing markets",
                },
                {
                  content:
                    "Giving customers means to manufacture products themselves ",
                },
                {
                  content: "Tetra Park",
                },
              ],
              isInput: true,
              questionNumber: "38",
            },
            cols: ["Definition", "Example", "Company"],
            rows: [
              {
                name: "Operational innovations",
                cells: [
                  {
                    content:
                      "Being innovative in the way existing business ____ are carried out",
                    isInput: true,
                    questionNumber: "36",
                  },
                  {
                    content: "Moving goods by\nsystem known as ____",
                    isInput: true,
                    questionNumber: "37",
                  },
                  {
                    content: "Wal-Mart",
                  },
                ],
              },
              {
                name: "____ innovations",
                cells: [
                  {
                    content:
                      "Developing new approaches to meeting needs of existing markets",
                  },
                  {
                    content:
                      "Giving customers means to manufacture products themselves ",
                  },
                  {
                    content: "Tetra Park",
                  },
                ],
                isInput: true,
                questionNumber: "38",
              },
              {
                name: "____",
                cells: [
                  {
                    content:
                      "Identifying and meeting new types of customer needs",
                  },
                  {
                    content:
                      "Offering customers ____ to go with the main products ",
                    isInput: true,
                    questionNumber: "40",
                  },
                  {
                    content: "Air Liquide",
                  },
                ],
                isInput: true,
                questionNumber: "39",
              },
            ],
            answerConstraints: "NO MORE THAN TWO WORDS",
          }}
          onAnswer={(answers) => console.log("User answers: ", answers)}
        />
      </div>{" "}
      <div className="diagram-labelling">
        <h2 className="font-bold text-2xl my-4">Diagram labelling</h2>
        <h3 className="font-bold text-xl mt-4 mb-2">Admin</h3>
        <DiagramLabellingAdmin
          question={{
            questionStart: "23",
            questionEnd: "25",
            type: "diagram-labelling",
            instructions: [
              "Complete the notes on the diagram below",
              "Write ONE WORD ONLY for each question.",
            ],
            image: {
              headline: "The operational cycle",
              url: "https://simplyielts.com/wp-content/uploads/2022/07/labelling-coffee-maker-IELTS-Listening.webp",
            },
            questions: [
              {
                isInteractive: true,
                number: "23",
                text: "Float dropped into ocean and ____ by satellite",
              },
              {
                isInteractive: true,
                number: "24",
                text: "Average distance travelled: ____",
              },
              {
                isInteractive: true,
                number: "25",
                text: "Float records changes in salinity and ____",
              },
              {
                isInteractive: false,
                text: "Global satellite",
              },
            ],
          }}
          onChange={(updated) => console.log(updated)}
        />
        <h3 className="font-bold text-xl mt-4 mb-2">Exam</h3>
        <DiagramLabellingExam
          question={{
            questionStart: "12",
            questionEnd: "13",
            type: "diagram-labelling",
            instructions: [
              "Label the diagram below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER from the text for each answer.",
            ],
            image: {
              headline: "",
              url: "https://i.postimg.cc/j23p0TZs/Screenshot-14.png",
            },
            questions: [
              {
                isInteractive: true,
                number: "12",
                text: "The interior and exterior ____ of brick",
                questionId:
                  "20a75ede-6209-4221-8e78-66cc29caf3d5-1754855118127",
              },
              {
                isInteractive: true,
                number: "13",
                text: "Insulating air space ____ in size",
                questionId:
                  "03dd1f6f-f95d-4dbc-bcfb-ecb5c290ec1a-1754855150175",
              },
            ],
          }}
          onAnswerChange={(answers) => console.log(answers)}
        />
      </div>
      <div>
        <div>
          <h2 className="text-lg font-bold mb-2">🛠️ Flow Chart Admin</h2>
          <FlowChartAdmin
            onChange={(updated) => console.log(updated)}
            question={{
              type: "flow-chart",
              questionStart: 1,
              questionEnd: 4,
              instructions: [
                "Complete the flowchart below.",
                "Write NO MORE THAN THREE WORDS for each answer.",
              ],
              nodes: [
                {
                  id: "1",
                  text: "Step 1: Fill container with ____",
                  isInteractive: true,
                  questionNumber: 1,
                  position: "bottom",
                },
                {
                  id: "2",
                  text: "Use ____ to heat",
                  isInteractive: true,
                  questionNumber: 2,
                  position: "bottom",
                },
                {
                  id: "3",
                  text: "Add ____ for flavor",
                  isInteractive: true,
                  questionNumber: 3,
                  position: "bottom",
                },
                {
                  id: "4",
                  text: "Serve with ____",
                  isInteractive: true,
                  questionNumber: 4,
                  position: "bottom",
                },
              ],
            }}
          />
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">🎓 Flow Chart Exam</h2>
          <FlowChartExam
            question={{
              instructions: [
                "Complete the flow chart below. Write NO MORE THAN TWO WORDS from the text for each answer.",
              ],
              optionsHeadline: "List of something",
              questionStart: 6,
              questionEnd: 11,
              nodes: [
                {
                  id: "549644b0-8a49-49fd-aca1-4dc946150184-1754853902168",
                  text: "Combine the ____ water and other ingredients with a ____ to the desired consistency.",
                  isInteractive: true,
                  position: "bottom",
                  questionNumber: 6,
                  isMultiple: true,
                  questionStart: 6,
                  questionEnd: 7,
                },
                {
                  id: "5fd2554a-bcbe-41e2-b6e1-bae14cfb347c",
                  text: "Using the hand, fill ____ with the mixture-coat with ____ (provides a better finish) or water to prevent stickiness. ",
                  isInteractive: true,
                  questionNumber: 0,
                  position: "bottom",
                  interactionType: "input",
                  isMultiple: true,
                  questionStart: 8,
                  questionEnd: 9,
                },
                {
                  id: "ee6ed146-1c0a-4953-96e3-944454459890",
                  text: "Dry in the sun; try to avoid rain, which will cause marks in the bricks – this will not affect the bricks’ ____ . Fire the bricks in a ____ ; patent kilns/large-scale",
                  isInteractive: true,
                  questionNumber: 0,
                  position: "bottom",
                  interactionType: "input",
                  isMultiple: true,
                  questionStart: 10,
                  questionEnd: 11,
                },
              ],
              matchingOptions: [],
            }}
            onAnswer={(answers) => console.log(answers)}
          />
        </div>
      </div>
    </div>
  );
}
