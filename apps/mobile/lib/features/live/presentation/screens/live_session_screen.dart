import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

final _dioProvider = Provider((ref) => Dio());

final _sessionDetailProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, id) async {
  final dio = ref.read(_dioProvider);
  final res = await dio.get('/live/sessions/$id');
  return res.data['data'] as Map<String, dynamic>?;
});

class LiveSessionScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const LiveSessionScreen({super.key, required this.sessionId});

  @override
  ConsumerState<LiveSessionScreen> createState() => _LiveSessionScreenState();
}

class _LiveSessionScreenState extends ConsumerState<LiveSessionScreen> {
  bool _joined = false;
  bool _micOn = true;
  bool _camOn = true;
  bool _chatOpen = false;
  final _chatController = TextEditingController();
  final List<Map<String, String>> _chatMessages = [];

  Future<void> _joinSession(Dio dio) async {
    try {
      await dio.post('/live/sessions/${widget.sessionId}/join');
      if (mounted) setState(() => _joined = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to join: $e')));
      }
    }
  }

  Future<void> _leaveSession(Dio dio) async {
    try {
      await dio.post('/live/sessions/${widget.sessionId}/leave');
    } catch (_) {}
    if (mounted) Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _chatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(_sessionDetailProvider(widget.sessionId));
    final dio = ref.read(_dioProvider);

    return sessionAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (session) {
        if (session == null) {
          return const Scaffold(body: Center(child: Text('Session not found')));
        }

        return Scaffold(
          backgroundColor: Colors.grey.shade900,
          body: SafeArea(
            child: Stack(
              children: [
                // Main video area
                Column(
                  children: [
                    // Top bar
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(6)),
                            child: const Row(children: [
                              Icon(Icons.circle, size: 6, color: Colors.white),
                              SizedBox(width: 4),
                              Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                            ]),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(session['title'] ?? 'Live Session',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                          Icon(Icons.people, color: Colors.white.withOpacity(0.7), size: 16),
                          const SizedBox(width: 4),
                          Text('${session['participantCount'] ?? 0}', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                        ],
                      ),
                    ),

                    // Video placeholder
                    Expanded(
                      child: !_joined
                          ? _JoinPrompt(session: session, onJoin: () => _joinSession(dio))
                          : Center(
                              child: Container(
                                margin: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade800,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.videocam_off, size: 48, color: Colors.grey.shade500),
                                      const SizedBox(height: 8),
                                      Text('Video stream placeholder', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                                      Text('(WebRTC integration via Jitsi/LiveKit)', style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                    ),

                    // Chat panel
                    if (_chatOpen && _joined)
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade800,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                        ),
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              child: Row(
                                children: [
                                  const Text('Chat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                  const Spacer(),
                                  IconButton(onPressed: () => setState(() => _chatOpen = false),
                                      icon: Icon(Icons.close, color: Colors.grey.shade400, size: 18)),
                                ],
                              ),
                            ),
                            Expanded(
                              child: ListView(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                children: _chatMessages.map((m) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: RichText(text: TextSpan(children: [
                                    TextSpan(text: '${m['name']}: ', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w600, fontSize: 12)),
                                    TextSpan(text: m['message'], style: const TextStyle(color: Colors.white, fontSize: 12)),
                                  ])),
                                )).toList(),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _chatController,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: InputDecoration(
                                        hintText: 'Type a message...',
                                        hintStyle: TextStyle(color: Colors.grey.shade500),
                                        filled: true, fillColor: Colors.grey.shade700,
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  IconButton(
                                    onPressed: () {
                                      final text = _chatController.text.trim();
                                      if (text.isNotEmpty) {
                                        setState(() {
                                          _chatMessages.add({'name': 'You', 'message': text});
                                          _chatController.clear();
                                        });
                                      }
                                    },
                                    icon: const Icon(Icons.send, color: Colors.blue, size: 20),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Control bar
                    if (_joined)
                      Container(
                        color: Colors.grey.shade900,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _ControlButton(
                              icon: _micOn ? Icons.mic : Icons.mic_off,
                              label: _micOn ? 'Mic On' : 'Mic Off',
                              color: _micOn ? Colors.grey.shade700 : Colors.red,
                              onTap: () => setState(() => _micOn = !_micOn),
                            ),
                            _ControlButton(
                              icon: _camOn ? Icons.videocam : Icons.videocam_off,
                              label: _camOn ? 'Cam On' : 'Cam Off',
                              color: _camOn ? Colors.grey.shade700 : Colors.red,
                              onTap: () => setState(() => _camOn = !_camOn),
                            ),
                            _ControlButton(
                              icon: Icons.chat_bubble_outline,
                              label: 'Chat',
                              color: _chatOpen ? Colors.blue : Colors.grey.shade700,
                              onTap: () => setState(() => _chatOpen = !_chatOpen),
                            ),
                            _ControlButton(
                              icon: Icons.call_end,
                              label: 'Leave',
                              color: Colors.red,
                              onTap: () => _leaveSession(dio),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _JoinPrompt extends StatelessWidget {
  final Map<String, dynamic> session;
  final VoidCallback onJoin;
  const _JoinPrompt({required this.session, required this.onJoin});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [Colors.blue.shade600, Colors.purple.shade500]),
            ),
            child: const Icon(Icons.videocam, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 20),
          Text(session['title'] ?? 'Live Session',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(session['description'] ?? '',
              style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              textAlign: TextAlign.center,
              maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: onJoin,
            icon: const Icon(Icons.videocam),
            label: const Text('Join Session'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ControlButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10)),
        ],
      ),
    );
  }
}
