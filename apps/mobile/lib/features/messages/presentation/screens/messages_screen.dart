import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  String? _selectedConversationId;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  static const _conversations = [
    _Conv('c-1', 'Alice Johnson', 'Hey, do you have notes from today?', '10:32 AM', 2, false),
    _Conv('c-2', 'Math Study Group', 'Chapter 5 quiz tomorrow!', '9:15 AM', 0, true),
    _Conv('c-3', 'Prof. Williams', 'Your assignment was excellent.', 'Yesterday', 0, false),
    _Conv('c-4', 'Carlos Garcia', 'Ready for the project meeting?', 'Yesterday', 1, false),
  ];

  static const _messages = [
    _Msg('m-1', false, 'Hey, do you have notes from today?', '10:28 AM'),
    _Msg('m-2', true, 'Yeah, I just finished them. Sending now!', '10:29 AM'),
    _Msg('m-3', false, 'Awesome, thanks! The lecture was intense.', '10:30 AM'),
    _Msg('m-4', true, 'Totally. The integration by parts section was tricky.', '10:31 AM'),
    _Msg('m-5', false, 'Hey, do you have notes from today?', '10:32 AM'),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 700;

    if (isWide) {
      return Scaffold(
        appBar: AppBar(title: const Text('Messages')),
        body: Row(
          children: [
            SizedBox(width: 300, child: _ConversationList(selected: _selectedConversationId, onSelect: (id) => setState(() => _selectedConversationId = id))),
            const VerticalDivider(width: 1),
            Expanded(child: _selectedConversationId == null ? const _EmptyState() : _ChatPanel(messages: _messages, controller: _messageController, scrollController: _scrollController)),
          ],
        ),
      );
    }

    if (_selectedConversationId != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_conversations.firstWhere((c) => c.id == _selectedConversationId).name),
          leading: BackButton(onPressed: () => setState(() => _selectedConversationId = null)),
        ),
        body: _ChatPanel(messages: _messages, controller: _messageController, scrollController: _scrollController),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () {})],
      ),
      body: _ConversationList(selected: _selectedConversationId, onSelect: (id) => setState(() => _selectedConversationId = id)),
    );
  }
}

class _ConversationList extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const _ConversationList({required this.selected, required this.onSelect});

  static const _conversations = [
    _Conv('c-1', 'Alice Johnson', 'Hey, do you have notes from today?', '10:32 AM', 2, false),
    _Conv('c-2', 'Math Study Group', 'Chapter 5 quiz tomorrow!', '9:15 AM', 0, true),
    _Conv('c-3', 'Prof. Williams', 'Your assignment was excellent.', 'Yesterday', 0, false),
    _Conv('c-4', 'Carlos Garcia', 'Ready for the project meeting?', 'Yesterday', 1, false),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: _conversations.length,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
      itemBuilder: (context, i) {
        final c = _conversations[i];
        final isSelected = c.id == selected;
        return ListTile(
          tileColor: isSelected ? Theme.of(context).colorScheme.primary.withOpacity(0.08) : null,
          leading: CircleAvatar(
            backgroundColor: Colors.primaries[i % Colors.primaries.length],
            child: Text(c.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          title: Row(
            children: [
              Expanded(child: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600))),
              Text(c.time, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          subtitle: Text(
            c.lastMessage,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: c.unread > 0 ? Colors.black87 : Colors.grey),
          ),
          trailing: c.unread > 0
              ? Badge(label: Text('${c.unread}'))
              : null,
          onTap: () => onSelect(c.id),
        );
      },
    );
  }
}

class _ChatPanel extends StatelessWidget {
  final List<_Msg> messages;
  final TextEditingController controller;
  final ScrollController scrollController;

  const _ChatPanel({required this.messages, required this.controller, required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            itemBuilder: (context, i) {
              final msg = messages[i];
              return _MessageBubble(msg: msg);
            },
          ),
        ),
        _InputBar(controller: controller),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final _Msg msg;
  const _MessageBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: msg.isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: msg.isMe ? Theme.of(context).colorScheme.primary : Colors.grey[200],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(msg.isMe ? 18 : 4),
            bottomRight: Radius.circular(msg.isMe ? 4 : 18),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              msg.content,
              style: TextStyle(color: msg.isMe ? Colors.white : Colors.black87),
            ),
            const SizedBox(height: 2),
            Text(
              msg.time,
              style: TextStyle(fontSize: 11, color: msg.isMe ? Colors.white70 : Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  const _InputBar({required this.controller});

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
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              minLines: 1,
              maxLines: 4,
            ),
          ),
          const SizedBox(width: 8),
          FloatingActionButton.small(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                controller.clear();
              }
            },
            child: const Icon(Icons.send),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text('Select a conversation', style: TextStyle(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }
}

class _Conv {
  final String id;
  final String name;
  final String lastMessage;
  final String time;
  final int unread;
  final bool isGroup;

  const _Conv(this.id, this.name, this.lastMessage, this.time, this.unread, this.isGroup);
}

class _Msg {
  final String id;
  final bool isMe;
  final String content;
  final String time;

  const _Msg(this.id, this.isMe, this.content, this.time);
}
