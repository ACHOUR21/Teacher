"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RESEARCH_ASSISTANT_PIPELINE = void 0;
/**
 * Research Assistant Pipeline
 * Researches a topic and creates comprehensive study materials.
 *
 * Input: { topic, depth?, userId, tenantId }
 * Output: { summary, flashcards, mindMap }
 */
const RESEARCH_ASSISTANT_PIPELINE = exports.RESEARCH_ASSISTANT_PIPELINE = {
  id: 'research-assistant',
  name: 'Research Assistant & Study Materials Generator',
  timeout: 120_000,
  steps: [
  // Step 1: Generate 5 search queries for the topic
  {
    id: 'generate_queries',
    type: 'ai_completion',
    config: {
      system: 'You are an expert researcher who knows how to formulate precise academic search queries.',
      prompt: `Generate 5 targeted search queries for researching: "{{input.topic}}"
Research depth: {{input.depth}}

Return JSON:
{
  "queries": [
    {
      "query": string,
      "intent": "overview"|"technical"|"historical"|"applications"|"controversy",
      "expectedSources": string[]
    }
  ],
  "mainConcepts": string[],
  "researchAngle": string
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 2: Simulated search — return placeholder results with key concepts
  {
    id: 'search_results',
    type: 'search',
    inputFrom: ['generate_queries'],
    config: {
      description: 'Search for academic and educational content about the topic',
      maxResults: 5
    }
  },
  // Step 3: AI synthesizes research into a structured summary
  {
    id: 'synthesize_research',
    type: 'ai_completion',
    inputFrom: ['generate_queries', 'search_results'],
    config: {
      system: 'You are an expert academic researcher and writer. Synthesize information into clear, accurate, well-structured educational content.',
      prompt: `Based on the research queries and results for "{{input.topic}}":

Queries and concepts: {{steps.generate_queries.output}}
Search results: {{steps.search_results.output}}

Write a comprehensive research synthesis with depth: {{input.depth}}

Return JSON:
{
  "title": string,
  "abstract": string,
  "sections": [
    {
      "heading": string,
      "content": string,
      "keyFacts": string[]
    }
  ],
  "citations": [
    {
      "title": string,
      "source": string,
      "relevance": string
    }
  ],
  "conclusion": string,
  "furtherReading": string[]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 4: Generate flashcards from the research summary
  {
    id: 'generate_flashcards',
    type: 'ai_completion',
    inputFrom: ['synthesize_research'],
    config: {
      system: 'You are an expert at creating spaced-repetition flashcards that optimize long-term retention.',
      prompt: `Based on this research summary about "{{input.topic}}": {{steps.synthesize_research.output}}

Create 10 high-quality flashcards covering the most important concepts.
Vary difficulty levels and include both factual recall and conceptual understanding.

Return JSON:
{
  "flashcards": [
    {
      "id": number,
      "front": string,
      "back": string,
      "hint": string|null,
      "difficulty": "easy"|"medium"|"hard",
      "category": string,
      "tags": string[]
    }
  ]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Step 5: Generate a mind map structure
  {
    id: 'generate_mind_map',
    type: 'ai_completion',
    inputFrom: ['synthesize_research'],
    config: {
      system: 'You are an expert at visual knowledge organization. Create clear, hierarchical mind maps that show relationships between concepts.',
      prompt: `Based on the research about "{{input.topic}}": {{steps.synthesize_research.output}}

Create a comprehensive mind map structure with interconnected nodes and edges.

Return JSON:
{
  "central": string,
  "nodes": [
    {
      "id": string,
      "label": string,
      "level": number,
      "parentId": string|null,
      "description": string,
      "color": string
    }
  ],
  "edges": [
    {
      "from": string,
      "to": string,
      "label": string|null,
      "type": "parent_child"|"related"|"causes"|"contrast"
    }
  ]
}

Return only valid JSON.`,
      responseFormat: 'json'
    }
  },
  // Final: Assemble all materials
  {
    id: 'assemble_materials',
    type: 'transform',
    inputFrom: ['synthesize_research', 'generate_flashcards', 'generate_mind_map'],
    config: {
      operation: 'assemble',
      template: {
        summary: 'synthesize_research',
        flashcards: 'generate_flashcards',
        mindMap: 'generate_mind_map'
      }
    }
  }]
};