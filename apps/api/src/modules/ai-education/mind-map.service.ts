/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIModuleType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
  color?: string;
}

export interface MindMapResult {
  topic: string;
  root: MindMapNode;
  generatedAt: Date;
}

@Injectable()
export class MindMapService {
  private readonly logger = new Logger(MindMapService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key' });
  }

  async generateMindMap(
    userId: string,
    tenantId: string,
    topic: string,
    depth: 'shallow' | 'deep' = 'deep',
  ): Promise<MindMapResult> {
    const depthInstruction = depth === 'shallow'
      ? 'Include up to 4 main branches and 2 sub-branches each.'
      : 'Include up to 6 main branches and 4 sub-branches each.';

    const systemPrompt =
      `You are a mind map generator. Return ONLY valid JSON in the format: ` +
      `{ "root": { "id": "root", "label": "<topic>", "children": [...] } } ` +
      `with up to 6 main branches and 4 sub-branches each.`;

    const userPrompt = `Generate a comprehensive mind map for the topic: "${topic}". ${depthInstruction} Each node must have a unique "id" (string), a "label" (string), and a "children" array (can be empty). Optionally include a "color" field (hex string) for branch nodes.`;

    let root: MindMapNode;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = (msg.content[0] as { type: 'text'; text: string }).text;
      const parsed = JSON.parse(text) as { root: MindMapNode };
      root = parsed.root;
    } catch (err) {
      this.logger.error('Failed to generate mind map from Claude', err);
      root = {
        id: 'root',
        label: topic,
        children: [
          { id: 'branch-1', label: 'Overview', children: [] },
          { id: 'branch-2', label: 'Key Concepts', children: [] },
          { id: 'branch-3', label: 'Applications', children: [] },
        ],
      };
    }

    // Store in AIConversation table with type mind_map
    try {
      const conversation = await this.prisma.aIConversation.create({
        data: {
          tenantId,
          userId,
          module: AIModuleType.MIND_MAP,
          title: `Mind Map: ${topic}`,
          context: { topic, depth, root } as object,
        },
      });
      this.logger.log(`Mind map conversation stored: ${conversation.id}`);
    } catch (err) {
      this.logger.warn('Failed to store mind map conversation', err);
    }

    const result: MindMapResult = {
      topic,
      root,
      generatedAt: new Date(),
    };

    return result;
  }
}
