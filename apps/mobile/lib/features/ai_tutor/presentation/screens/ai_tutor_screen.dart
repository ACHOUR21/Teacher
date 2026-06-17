import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../features/auth/presentation/providers/auth_provider.dart';

class AIMessage {
  final String role;
  final String content;
  final DateTime timestamp;
  AIMessage({required this.role, required this.content}) : timestamp = DateTime.now();
}

final _messagesProvider = StateProvider<List<AIMessage>>((ref) => []);
final _loadingProvider = StateProvider<bool>((ref) => false);
final _subjectProvider = StateProvider<String>((ref) => 'Mathematics');
final _conversationIdProvider = StateProvider<String?>((ref) => null);

class AITutorScreen extends ConsumerStatefulWidget {
  const AITutorScreen({super.key});

  @override
  ConsumerState<AITutorScreen> createState() => _AITutorScreenState();
}

class _AITutorScreenState extends ConsumerState<AITutorScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  static const _subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Computer Science'];

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    _controller.clear();

    final subject = ref.read(_subjectProvider);
    final conversationId = ref.read(_conversationIdProvider);

    ref.read(_messagesProvider.notifier).update((msgs) => [
      ...msgs,
      AIMessage(role: 'user', content: text),
    ]);
    ref.read(_loadingProvider.notifier).state = true;

    _scrollToBottom();

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.post('/ai/tutor/chat', data: {
        'message': text,
        'subject': subject,
        if (conversationId != null) 'conversationId': conversationId,
      });

      final data = response.data['data'];
      if (data['conversationId'] != null) {
        ref.read(_conversationIdProvider.notifier).state = data['conversationId'];
      }

      ref.read(_messagesProvider.notifier).update((msgs) => [
        ...msgs,
        AIMessage(role: 'assistant', content: data['answer'] ?? 'Sorry, I could not process that.'),
      ]);
    } catch (e) {
      ref.read(_messagesProvider.notifier).update((msgs) => [
        ...msgs,
        AIMessage(role: 'assistant', content: 'Error: Could not connect to AI service.'),
      ]);
    } finally {
      ref.read(_loadingProvider.notifier).state = false;
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(_messagesProvider);
    final isLoading = ref.watch(_loadingProvider);
    final subject = ref.watch(_subjectProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Tutor'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.subject),
            onSelected: (s) {
              ref.read(_subjectProvider.notifier).state = s;
              ref.read(_messagesProvider.notifier).state = [];
              ref.read(_conversationIdProvider.notifier).state = null;
            },
            itemBuilder: (_) => _subjects.map((s) => PopupMenuItem(value: s, child: Text(s))).toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Subject chip
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
            child: Text('Subject: $subject', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w600)),
          ),

          // Messages
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.smart_toy_outlined, size: 48, color: Theme.of(context).colorScheme.primary),
                        ),
                        const SizedBox(height: 16),
                        Text('AI Tutor Ready', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('Ask me anything about $subject', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length + (isLoading ? 1 : 0),
                    itemBuilder: (_, i) {
                      if (i == messages.length) return _TypingIndicator();
                      final msg = messages[i];
                      return _MessageBubble(message: msg);
                    },
                  ),
          ),

          // Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onSubmitted: _sendMessage,
                    decoration: InputDecoration(
                      hintText: 'Ask about $subject...',
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                    ),
                    maxLines: null,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: isLoading ? null : () => _sendMessage(_controller.text),
                  icon: const Icon(Icons.send, size: 20),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final AIMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: const Icon(Icons.smart_toy, size: 16, color: Colors.white),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                message.content,
                style: TextStyle(color: isUser ? Colors.white : Colors.grey.shade800, fontSize: 14, height: 1.5),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: Theme.of(context).colorScheme.primary,
          child: const Icon(Icons.smart_toy, size: 16, color: Colors.white),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (i) => AnimatedDot(delay: i * 150)),
          ),
        ),
      ],
    );
  }
}

class AnimatedDot extends StatefulWidget {
  final int delay;
  const AnimatedDot({super.key, required this.delay});

  @override
  State<AnimatedDot> createState() => _AnimatedDotState();
}

class _AnimatedDotState extends State<AnimatedDot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))
      ..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 2),
    child: AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Transform.translate(
        offset: Offset(0, -4 * _anim.value),
        child: Container(width: 6, height: 6, decoration: BoxDecoration(color: Colors.grey.shade500, shape: BoxShape.circle)),
      ),
    ),
  );
}
