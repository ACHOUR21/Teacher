import { useEffect, useRef, useState, useCallback } from 'react';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};
export function useWebRTC(socket) {
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    // ------------------------------------------------------------------ helpers
    const removePeer = useCallback((socketId) => {
        peersRef.current.get(socketId)?.close();
        peersRef.current.delete(socketId);
        setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
        });
    }, []);
    const buildPeerConnection = useCallback((targetSocketId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        // add local tracks
        localStreamRef.current?.getTracks().forEach(t => {
            pc.addTrack(t, localStreamRef.current);
        });
        // receive remote stream
        pc.ontrack = ev => {
            setRemoteStreams(prev => new Map(prev).set(targetSocketId, ev.streams[0]));
        };
        // send ICE candidates through signaling
        pc.onicecandidate = ev => {
            if (ev.candidate) {
                socket?.emit('webrtc-ice-candidate', {
                    targetId: targetSocketId,
                    candidate: ev.candidate,
                });
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                removePeer(targetSocketId);
            }
        };
        peersRef.current.set(targetSocketId, pc);
        return pc;
    }, [socket, removePeer]);
    // ------------------------------------------------------------------ public API
    /** Initiate a call to a newly-joined peer (caller side). */
    const callPeer = useCallback(async (targetSocketId) => {
        const pc = buildPeerConnection(targetSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('webrtc-offer', { targetId: targetSocketId, offer });
    }, [buildPeerConnection, socket]);
    /** Mute or unmute local audio. */
    const setMicEnabled = useCallback((enabled) => {
        localStreamRef.current?.getAudioTracks().forEach(t => {
            t.enabled = enabled;
        });
    }, []);
    /** Enable or disable local video. */
    const setCameraEnabled = useCallback((enabled) => {
        localStreamRef.current?.getVideoTracks().forEach(t => {
            t.enabled = enabled;
        });
    }, []);
    /** Stop all streams and close all peer connections. */
    const stopAll = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setLocalStream(null);
        setRemoteStreams(new Map());
    }, []);
    // ------------------------------------------------------------------ signaling listeners
    useEffect(() => {
        if (!socket) {
            return;
        }
        const onOffer = async ({ from, offer }) => {
            const pc = buildPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { targetId: from, answer });
        };
        const onAnswer = async ({ from, answer }) => {
            const pc = peersRef.current.get(from);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };
        const onIceCandidate = async ({ from, candidate, }) => {
            const pc = peersRef.current.get(from);
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
            }
        };
        socket.on('webrtc-offer', onOffer);
        socket.on('webrtc-answer', onAnswer);
        socket.on('webrtc-ice-candidate', onIceCandidate);
        return () => {
            socket.off('webrtc-offer', onOffer);
            socket.off('webrtc-answer', onAnswer);
            socket.off('webrtc-ice-candidate', onIceCandidate);
        };
    }, [socket, buildPeerConnection]);
    // ------------------------------------------------------------------ local media on mount
    useEffect(() => {
        let cancelled = false;
        navigator.mediaDevices
            ?.getUserMedia({ audio: true, video: true })
            .then(stream => {
            if (cancelled) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            localStreamRef.current = stream;
            setLocalStream(stream);
        })
            .catch(() => {
            // Gracefully handle denied / unavailable media (e.g. in headless test env)
        });
        return () => {
            cancelled = true;
            stopAll();
        };
    }, []);
    return { localStream, remoteStreams, callPeer, setMicEnabled, setCameraEnabled, stopAll };
}
