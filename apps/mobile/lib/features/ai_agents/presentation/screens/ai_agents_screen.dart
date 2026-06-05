import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AiAgentsScreen extends ConsumerStatefulWidget {
  const AiAgentsScreen({super.key});

  @override
  ConsumerState<AiAgentsScreen> createState() => _AiAgentsScreenState();
}

class _AiAgentsScreenState extends ConsumerState<AiAgentsScreen> {
  _Agent? _selectedAgent;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final List<_Message> _messages = [];
  bool _isTyping = false;

  static const _agents = [
    _Agent('STUDY_PLANNER', 'Study Planner', 'Create personalized study schedules and track your learning goals.', '📅', Color(0xFF1565C0)),
    _Agent('HOMEWORK_ASSISTANT', 'Homework Assistant', 'Get guided help through problems without being given direct answers.', '📝', Color(0xFF2E7D32)),
    _Agent('RESEARCH_ASSISTANT', 'Research Assistant', 'Find credible sources and structure academic papers.', '🔍', Color(0xFF6A1B9A)),
    _Agent('CAREER_ADVISOR', 'Career Advisor', 'Explore career paths and get personalized advice.', '🎯', Color(0xFFE65100)),
    _Agent('PERFORMANCE_COACH', 'Performance Coach', 'Analyze your learning patterns and optimize your performance.', '📈', Color(0xFF00838F)),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _selectAgent(_Agent agent) {
    setState(() {
      _selectedAgent = agent;
      _messages.clear();
      _messages.add(_Message(
        id: 'welcome',
        isAgent: true,
        content: 'Hi! I\'m your ${agent.name}. ${agent.description} How can I help you today?',
        time: _now(),
      ));
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isTyping) return;

    setState(() {
      _messages.add(_Message(id: 'u-${_messages.length}', isAgent: false, content: text, time: _now()));
      _isTyping = true;
    });
    _messageController.clear();
    _scrollToBottom();

    // Simulate AI response
    await Future.delayed(const Duration(milliseconds: 1500));
    if (mounted) {
      setState(() {
        _messages.add(_Message(
          id: 'a-${_messages.length}',
          isAgent: true,
          content: _mockResponse(_selectedAgent!.type, text),
          time: _now(),
        ));
        _isTyping = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _mockResponse(String type, String input) => switch (type) {
    'STUDY_PLANNER' => 'Based on your goals, I\'d recommend breaking your study sessions into 25-minute focused blocks (Pomodoro technique). Let\'s create a schedule: Monday-Wednesday for core subjects, Thursday for practice problems, Friday for review. What subjects should we prioritize?',
    'HOMEWORK_ASSISTANT' => 'Great question! Let\'s work through this step by step. First, what information do you already have? Understanding what you know will help us identify exactly where to focus. What have you tried so far?',
    'RESEARCH_ASSISTANT' => 'For this topic, I\'d suggest checking peer-reviewed sources from JSTOR, Google Scholar, or PubMed. Can you share your thesis statement? That will help me suggest the most relevant search terms and help you evaluate source credibility.',
    'CAREER_ADVISOR' => 'That\'s a great career direction! The field has strong growth projections — around 15% over the next decade. Key skills to develop include data analysis, communication, and domain expertise. Would you like me to outline a learning roadmap?',
    _ => 'I\'ve analyzed your current performance data. Your strongest area is problem-solving (top 20%), while time management could use improvement. I recommend scheduling difficult tasks in your peak focus hours (9-11 AM based on your activity patterns). Shall we set some specific goals?',
  };

  String _now() {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedAgent == null) {
      return _AgentPicker(agents: _agents, onSelect: _selectAgent);
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Text(_selectedAgent!.emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(_selectedAgent!.name),
          ],
        ),
        leading: BackButton(onPressed: () => setState(() { _selectedAgent = null; _messages.clear(); })),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, i) {
                if (_isTyping && i == _messages.length) {
                  return _TypingIndicator(color: _selectedAgent!.color);
                }
                return _MessageBubble(msg: _messages[i], agentColor: _selectedAgent!.color);
              },
            ),
          ),
          _InputRow(controller: _messageController, onSend: _sendMessage, isLoading: _isTyping),
        ],
      ),
    );
  }
}

class _AgentPicker extends StatelessWidget {
  final List<_Agent> agents;
  final ValueChanged<_Agent> onSelect;

  const _AgentPicker({required this.agents, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(title: const Text('AI Agents')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Choose an AI Agent', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Each agent is specialized for different learning tasks.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 20),
          ...agents.map((a) => _AgentCard(agent: a, onTap: () => onSelect(a))),
        ],
      ),
    );
  }
}

class _AgentCard extends StatelessWidget {
  final _Agent agent;
  final VoidCallback onTap;

  const _AgentCard({required this.agent, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: agent.color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(child: Text(agent.emoji, style: const TextStyle(fontSize: 28))),
        ),
        title: Text(agent.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(agent.description, style: const TextStyle(fontSize: 13)),
        ),
        trailing: Icon(Icons.chevron_right, color: agent.color),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final _Message msg;
  final Color agentColor;

  const _MessageBubble({required this.msg, required this.agentColor});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: msg.isAgent ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.80),
        decoration: BoxDecoration(
          color: msg.isAgent ? agentColor.withOpacity(0.1) : agentColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(msg.isAgent ? 4 : 18),
            bottomRight: Radius.circular(msg.isAgent ? 18 : 4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              msg.content,
              style: TextStyle(color: msg.isAgent ? Colors.black87 : Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              msg.time,
              style: TextStyle(fontSize: 11, color: msg.isAgent ? Colors.black45 : Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  final Color color;
  const _TypingIndicator({required this.color});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Thinking', style: TextStyle(color: color, fontSize: 13)),
            const SizedBox(width: 6),
            SizedBox(
              width: 24,
              child: LinearProgressIndicator(
                color: color,
                backgroundColor: color.withOpacity(0.2),
                minHeight: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InputRow extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final bool isLoading;

  const _InputRow({required this.controller, required this.onSend, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: !isLoading,
              decoration: InputDecoration(
                hintText: 'Ask the agent anything...',
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              minLines: 1,
              maxLines: 4,
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: 8),
          FloatingActionButton.small(
            onPressed: isLoading ? null : onSend,
            child: isLoading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send),
          ),
        ],
      ),
    );
  }
}

class _Agent {
  final String type;
  final String name;
  final String description;
  final String emoji;
  final Color color;

  const _Agent(this.type, this.name, this.description, this.emoji, this.color);
}

class _Message {
  final String id;
  final bool isAgent;
  final String content;
  final String time;

  const _Message({required this.id, required this.isAgent, required this.content, required this.time});
}
