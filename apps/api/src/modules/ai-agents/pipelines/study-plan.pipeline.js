"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STUDY_PLAN_PIPELINE = void 0;
/**
 * Study Plan Pipeline
 * Generates a personalized weekly study plan for a student.
 *
 * Input: { userId, tenantId, studentName?, subjects? }
 * Output: { studyPlan, flashcardSuggestions, estimatedHours }
 */
const STUDY_PLAN_PIPELINE = exports.STUDY_PLAN_PIPELINE = {
  id: 'study-plan',
  name: 'Personalized Study Plan Generator',
  timeout: 90_000,
  steps: [
  // Step 1: Fetch student data from DB
  {
    id: 'fetch_student_data',
    type: 'database_query',
    config: {
      query: 'student_performance',
      description: 'Fetch enrolled courses and performance metrics for the student'
    }
  },
  // Step 2: AI analyzes gaps and generates weekly study schedule
  {
    id: 'analyze_and_schedule',
    type: 'ai_completion',
    inputFrom: ['fetch_student_data'],
    config: {
      system: 'You are an expert academic advisor. Generate a personalized study plan based on the student\'s performance data.',
      prompt: `Based on the following student data: {{steps.fetch_student_data.output}}
And the student's context: {{input.subjects}}

Generate a 4-week personalized study schedule in JSON format with this structure:
{
  "studentName": string,
  "totalWeeks": 4,
  "weeklySchedule": [
    {
      "week": number,
      "theme": string,
      "days": [
        {
          "day": "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday",
          "sessions": [
            {
              "subject": string,
              "topic": string,
              "duration": number,
              "priority": "high"|"medium"|"low",
              "resources": string[]
            }
          ]
        }
      ],
      "goals": string[],
      "weeklyHours": number
    }
  ],
  "weakAreas": string[],
  "strengths": string[]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 3: Transform schedule into clean structured format
  {
    id: 'structure_schedule',
    type: 'transform',
    inputFrom: ['analyze_and_schedule'],
    config: {
      operation: 'json_parse',
      sourceStep: 'analyze_and_schedule'
    }
  },
  // Step 4: Generate flashcard prompts for weak topics
  {
    id: 'generate_flashcard_prompts',
    type: 'ai_completion',
    inputFrom: ['analyze_and_schedule'],
    config: {
      system: 'You are an expert at creating educational flashcard prompts that reinforce weak concepts.',
      prompt: `Based on this study plan and weak areas identified: {{steps.analyze_and_schedule.output}}

For each weak topic identified, generate 3 flashcard prompts. Return JSON:
{
  "flashcardSuggestions": [
    {
      "topic": string,
      "cards": [
        { "front": string, "back": string, "difficulty": "easy"|"medium"|"hard" }
      ]
    }
  ]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 5: Assemble final output
  {
    id: 'assemble_output',
    type: 'transform',
    inputFrom: ['structure_schedule', 'generate_flashcard_prompts'],
    config: {
      operation: 'assemble',
      template: {
        studyPlan: 'structure_schedule',
        flashcardSuggestions: 'generate_flashcard_prompts'
      }
    }
  }]
};