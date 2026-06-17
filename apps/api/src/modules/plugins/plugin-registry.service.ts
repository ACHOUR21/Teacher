import { Injectable, NotFoundException } from '@nestjs/common';

export interface PluginListing {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  author: string;
  price: number; // cents/month — 0 = free
  rating: number;
  installs: number;
  iconUrl: string;
  tags: string[];
  permissions: string[];
  screenshots: string[];
}

@Injectable()
export class PluginRegistryService {
  /** Built-in plugin catalog — no external registry needed for MVP */
  private readonly CATALOG: PluginListing[] = [
    {
      id: 'zoom-integration',
      name: 'Zoom Integration',
      version: '1.2.0',
      description: 'Connect Zoom meetings directly to your live classroom sessions',
      category: 'live-classroom',
      author: 'EduAI Official',
      price: 0,
      rating: 4.8,
      installs: 12400,
      iconUrl: 'https://cdn.eduai.example.com/plugins/zoom.png',
      tags: ['video', 'live', 'meetings'],
      permissions: ['read:courses'],
      screenshots: [],
    },
    {
      id: 'google-classroom-sync',
      name: 'Google Classroom Sync',
      version: '2.0.1',
      description: 'Import courses and assignments from Google Classroom',
      category: 'integrations',
      author: 'EduAI Official',
      price: 0,
      rating: 4.6,
      installs: 8900,
      iconUrl: 'https://cdn.eduai.example.com/plugins/google-classroom.png',
      tags: ['google', 'import', 'sync'],
      permissions: ['write:courses', 'write:assignments'],
      screenshots: [],
    },
    {
      id: 'plagiarism-turnitin',
      name: 'Turnitin Plagiarism Check',
      version: '1.0.3',
      description: 'Automatically check assignments for plagiarism via Turnitin',
      category: 'assessment',
      author: 'EduAI Official',
      price: 4900,
      rating: 4.9,
      installs: 5600,
      iconUrl: 'https://cdn.eduai.example.com/plugins/turnitin.png',
      tags: ['plagiarism', 'assignments', 'ai'],
      permissions: ['read:assignments', 'write:assignments'],
      screenshots: [],
    },
    {
      id: 'kahoot-quizzes',
      name: 'Kahoot! Quiz Import',
      version: '1.1.0',
      description: 'Import and run Kahoot quizzes in your courses',
      category: 'gamification',
      author: 'EduAI Official',
      price: 0,
      rating: 4.7,
      installs: 15200,
      iconUrl: 'https://cdn.eduai.example.com/plugins/kahoot.png',
      tags: ['quiz', 'gamification', 'engagement'],
      permissions: ['write:courses'],
      screenshots: [],
    },
    {
      id: 'stripe-marketplace',
      name: 'Stripe Course Marketplace',
      version: '3.0.0',
      description: 'Sell courses directly with Stripe — split revenue with instructors',
      category: 'monetization',
      author: 'EduAI Official',
      price: 0,
      rating: 4.9,
      installs: 7300,
      iconUrl: 'https://cdn.eduai.example.com/plugins/stripe.png',
      tags: ['payments', 'marketplace', 'revenue'],
      permissions: ['access:billing', 'read:courses'],
      screenshots: [],
    },
    {
      id: 'slack-notifications',
      name: 'Slack Notifications',
      version: '1.3.2',
      description: 'Send course updates, assignments, and grades to Slack channels',
      category: 'communications',
      author: 'EduAI Official',
      price: 0,
      rating: 4.5,
      installs: 9800,
      iconUrl: 'https://cdn.eduai.example.com/plugins/slack.png',
      tags: ['slack', 'notifications', 'integrations'],
      permissions: ['send:notifications'],
      screenshots: [],
    },
  ];

  listPlugins(filters?: { category?: string; search?: string; free?: boolean }): PluginListing[] {
    let results = [...this.CATALOG];

    if (filters?.category) {
      results = results.filter(p => p.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)),
      );
    }

    if (filters?.free === true) {
      results = results.filter(p => p.price === 0);
    }

    return results;
  }

  getPlugin(pluginId: string): PluginListing {
    const plugin = this.CATALOG.find(p => p.id === pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin "${pluginId}" not found in catalog`);
    }
    return plugin;
  }

  getCategories(): string[] {
    return [...new Set(this.CATALOG.map(p => p.category))];
  }
}
