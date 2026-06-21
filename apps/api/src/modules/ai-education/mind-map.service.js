"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MindMapService = void 0;
var _common = require("@nestjs/common");
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _client = require("@prisma/client");
var _prisma = require("../database/prisma.service");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var MindMapService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let MindMapService = exports.MindMapService = MindMapService_1 = class MindMapService {
  logger = new _common.Logger(MindMapService_1.name);
  anthropic;
  constructor(prisma) {
    this.prisma = prisma;
    this.anthropic = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  async generateMindMap(userId, tenantId, topic, depth = 'deep') {
    const depthInstruction = depth === 'shallow' ? 'Include up to 4 main branches and 2 sub-branches each.' : 'Include up to 6 main branches and 4 sub-branches each.';
    const systemPrompt = `You are a mind map generator. Return ONLY valid JSON in the format: ` + `{ "root": { "id": "root", "label": "<topic>", "children": [...] } } ` + `with up to 6 main branches and 4 sub-branches each.`;
    const userPrompt = `Generate a comprehensive mind map for the topic: "${topic}". ${depthInstruction} Each node must have a unique "id" (string), a "label" (string), and a "children" array (can be empty). Optionally include a "color" field (hex string) for branch nodes.`;
    let root;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });
      const text = msg.content[0].text;
      const parsed = JSON.parse(text);
      root = parsed.root;
    } catch (err) {
      this.logger.error('Failed to generate mind map from Claude', err);
      root = {
        id: 'root',
        label: topic,
        children: [{
          id: 'branch-1',
          label: 'Overview',
          children: []
        }, {
          id: 'branch-2',
          label: 'Key Concepts',
          children: []
        }, {
          id: 'branch-3',
          label: 'Applications',
          children: []
        }]
      };
    }
    // Store in AIConversation table with type mind_map
    try {
      const conversation = await this.prisma.aIConversation.create({
        data: {
          tenantId,
          userId,
          module: _client.AIModuleType.MIND_MAP,
          title: `Mind Map: ${topic}`,
          context: {
            topic,
            depth,
            root
          }
        }
      });
      this.logger.log(`Mind map conversation stored: ${conversation.id}`);
    } catch (err) {
      this.logger.warn('Failed to store mind map conversation', err);
    }
    const result = {
      topic,
      root,
      generatedAt: new Date()
    };
    return result;
  }
};
exports.MindMapService = MindMapService = MindMapService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], MindMapService);