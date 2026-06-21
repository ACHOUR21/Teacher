'use client';
import * as React from 'react';
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;
const toastTimeouts = new Map();
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
function addToRemoveQueue(toastId, dispatch) {
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({ type: 'REMOVE_TOAST', toastId });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
}
function reducer(state, action) {
    switch (action.type) {
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };
        case 'UPDATE_TOAST':
            return {
                ...state,
                toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t),
            };
        case 'DISMISS_TOAST': {
            const { toastId } = action;
            return {
                ...state,
                toasts: state.toasts.map((t) => t.id === toastId || toastId === undefined
                    ? { ...t, open: false }
                    : t),
            };
        }
        case 'REMOVE_TOAST':
            if (action.toastId === undefined) {
                return { ...state, toasts: [] };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
    }
}
const listeners = [];
let memoryState = { toasts: [] };
function dispatchGlobal(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => listener(memoryState));
}
function toast(props) {
    const id = genId();
    const dismiss = () => dispatchGlobal({ type: 'DISMISS_TOAST', toastId: id });
    dispatchGlobal({
        type: 'ADD_TOAST',
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) {
                    dismiss();
                }
            },
        },
    });
    addToRemoveQueue(id, dispatchGlobal);
    return { id, dismiss };
}
toast.success = (title, description) => toast({ title, description, variant: 'success' });
toast.error = (title, description) => toast({ title, description, variant: 'destructive' });
toast.warning = (title, description) => toast({ title, description, variant: 'warning' });
toast.info = (title, description) => toast({ title, description, variant: 'default' });
function useToast() {
    const [state, setState] = React.useState(memoryState);
    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);
    return {
        ...state,
        toast,
        dismiss: (toastId) => dispatchGlobal({ type: 'DISMISS_TOAST', toastId }),
    };
}
export { useToast, toast };
