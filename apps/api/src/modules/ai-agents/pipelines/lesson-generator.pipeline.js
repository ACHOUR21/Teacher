"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LESSON_GENERATOR_PIPELINE = void 0;
/**
 * Lesson Generator Pipeline
 * Generates a complete lesson from a topic.
 *
 * Input: { topic, gradeLevel?, duration?, userId, tenantId }
 * Output: { title, sections, quiz, summary, keyTakeaways }
 */
const LESSON_GENERATOR_PIPELINE = exports.LESSON_GENERATOR_PIPELINE = {
  id: 'lesson-generator',
  name: 'Complete Lesson Generator',
  timeout: 120_000,
  steps: [
  // Step 1: Generate lesson outline with 5 sections
  {
    id: 'generate_outline',
    type: 'ai_completion',
    config: {
      system: 'You are a master curriculum designer. Create structured lesson outlines that are engaging, pedagogically sound, and age-appropriate.',
      prompt: `Create a detailed lesson outline for the topic: "{{input.topic}}"
Grade level: {{input.gradeLevel}}
Duration: {{input.duration}} minutes

Return JSON:
{
  "title": string,
  "gradeLevel": string,
  "duration": number,
  "learningObjectives": string[],
  "sections": [
    {
      "id": string,
      "title": string,
      "type": "introduction"|"concept"|"practice"|"application"|"review",
      "durationMinutes": number,
      "keyPoints": string[],
      "teachingNotes": string
    }
  ]
}

Include exactly 5 sections. Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 2: Generate full content for each section (parallel execution after outline)
  {
    id: 'generate_section_1',
    type: 'ai_completion',
    inputFrom: ['generate_outline'],
    config: {
      system: 'You are an expert educator. Write rich, engaging educational content.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}

Write detailed content (approximately 300 words) for section 1 of the lesson on "{{input.topic}}".
Include examples, analogies, and teaching strategies.
Return JSON: { "sectionId": string, "content": string, "examples": string[], "activities": string[] }

Return only valid JSON.`,
      responseFormat: 'json'
    }
  }, {
    id: 'generate_section_2',
    type: 'ai_completion',
    inputFrom: ['generate_outline'],
    config: {
      system: 'You are an expert educator. Write rich, engaging educational content.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}

Write detailed content (approximately 300 words) for section 2 of the lesson on "{{input.topic}}".
Include examples, analogies, and teaching strategies.
Return JSON: { "sectionId": string, "content": string, "examples": string[], "activities": string[] }

Return only valid JSON.`,
      responseFormat: 'json'
    }
  }, {
    id: 'generate_section_3',
    type: 'ai_completion',
    inputFrom: ['generate_outline'],
    config: {
      system: 'You are an expert educator. Write rich, engaging educational content.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}

Write detailed content (approximately 300 words) for section 3 of the lesson on "{{input.topic}}".
Include examples, analogies, and teaching strategies.
Return JSON: { "sectionId": string, "content": string, "examples": string[], "activities": string[] }

Return only valid JSON.`,
      responseFormat: 'json'
    }
  }, {
    id: 'generate_section_4',
    type: 'ai_completion',
    inputFrom: ['generate_outline'],
    config: {
      system: 'You are an expert educator. Write rich, engaging educational content.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}

Write detailed content (approximately 300 words) for section 4 of the lesson on "{{input.topic}}".
Include examples, analogies, and teaching strategies.
Return JSON: { "sectionId": string, "content": string, "examples": string[], "activities": string[] }

Return only valid JSON.`,
      responseFormat: 'json'
    }
  }, {
    id: 'generate_section_5',
    type: 'ai_completion',
    inputFrom: ['generate_outline'],
    config: {
      system: 'You are an expert educator. Write rich, engaging educational content.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}

Write detailed content (approximately 300 words) for section 5 of the lesson on "{{input.topic}}".
Include examples, analogies, and teaching strategies.
Return JSON: { "sectionId": string, "content": string, "examples": string[], "activities": string[] }

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 3: Generate 5 quiz questions from the lesson content
  {
    id: 'generate_quiz',
    type: 'ai_completion',
    inputFrom: ['generate_section_1', 'generate_section_2', 'generate_section_3', 'generate_section_4', 'generate_section_5'],
    config: {
      system: 'You are an expert at creating educational assessments.',
      prompt: `Based on the lesson content about "{{input.topic}}" with these sections:
Section 1: {{steps.generate_section_1.output}}
Section 2: {{steps.generate_section_2.output}}
Section 3: {{steps.generate_section_3.output}}

Generate 5 quiz questions that test comprehension at different cognitive levels (recall, comprehension, application).
Return JSON:
{
  "questions": [
    {
      "id": number,
      "type": "multiple_choice"|"true_false"|"short_answer",
      "question": string,
      "options": string[]|null,
      "correctAnswer": string,
      "explanation": string,
      "cognitiveLevel": "recall"|"comprehension"|"application"
    }
  ]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 4: Generate summary and key takeaways
  {
    id: 'generate_summary',
    type: 'ai_completion',
    inputFrom: ['generate_outline', 'generate_section_1', 'generate_section_2'],
    config: {
      system: 'You are an expert at synthesizing educational content into clear summaries.',
      prompt: `Based on the lesson outline: {{steps.generate_outline.output}}
And content from sections 1 and 2: {{steps.generate_section_1.output}}

Write a comprehensive lesson summary and key takeaways for "{{input.topic}}".
Return JSON:
{
  "summary": string,
  "keyTakeaways": string[],
  "prerequisites": string[],
  "nextTopics": string[]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 5: Assemble the complete lesson
  {
    id: 'assemble_lesson',
    type: 'transform',
    inputFrom: ['generate_outline', 'generate_section_1', 'generate_section_2', 'generate_section_3', 'generate_section_4', 'generate_section_5', 'generate_quiz', 'generate_summary'],
    config: {
      operation: 'assemble',
      template: {
        outline: 'generate_outline',
        section1: 'generate_section_1',
        section2: 'generate_section_2',
        section3: 'generate_section_3',
        section4: 'generate_section_4',
        section5: 'generate_section_5',
        quiz: 'generate_quiz',
        summary: 'generate_summary'
      }
    }
  }]
};