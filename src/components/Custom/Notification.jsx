import React, { useEffect, useRef, useState } from 'react';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const variantStyles = {
    success: {
        light: 'bg-white border-l-emerald-500 text-emerald-800 shadow-lg',
        dark: 'bg-[#1C1C1C] border-l-emerald-500 text-emerald-200 shadow-lg',
        icon: faCheckCircle,
        iconLight: 'text-emerald-600',
        iconDark: 'text-emerald-400',
        bar: 'bg-emerald-500',
    },
    info: {
        light: 'bg-white border-l-blue-500 text-blue-800 shadow-lg',
        dark: 'bg-[#1C1C1C] border-l-blue-500 text-blue-200 shadow-lg',
        icon: faInfoCircle,
        iconLight: 'text-blue-600',
        iconDark: 'text-blue-400',
        bar: 'bg-blue-500',
    },
    warning: {
        light: 'bg-white border-l-amber-500 text-amber-900 shadow-lg',
        dark: 'bg-[#1C1C1C] border-l-amber-500 text-amber-200 shadow-lg',
        icon: faExclamationCircle,
        iconLight: 'text-amber-600',
        iconDark: 'text-amber-400',
        bar: 'bg-amber-500',
    },
    danger: {
        light: 'bg-white border-l-red-500 text-red-800 shadow-lg',
        dark: 'bg-[#1C1C1C] border-l-red-500 text-red-200 shadow-lg',
        icon: faTriangleExclamation,
        iconLight: 'text-red-600',
        iconDark: 'text-red-400',
        bar: 'bg-red-500',
    },
};

const Notification = ({ data, theme = 'light', duration = 4000, show = true, setShow }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const [progress, setProgress] = useState(100);
    const enterIdRef = useRef(null);

    useEffect(() => {
        if (show && data?.message) {
            setIsLeaving(false);
            setHasEntered(false);
            setIsVisible(true);
            setProgress(100);

            enterIdRef.current = requestAnimationFrame(() => setHasEntered(true));

            const start = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - start;
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(remaining);
            }, 50);

            const timer = setTimeout(() => {
                clearInterval(interval);
                setIsLeaving(true);
                setTimeout(() => {
                    setIsVisible(false);
                    setShow(false);
                }, 280);
            }, duration);

            return () => {
                if (enterIdRef.current != null) cancelAnimationFrame(enterIdRef.current);
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [show, data?.message, duration, setShow]);

    const handleClose = (e) => {
        e.stopPropagation();
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            setShow(false);
        }, 280);
    };

    if (!show && !isVisible) return null;

    const variant = data?.variant === 'success' ? 'success' 
        : data?.variant === 'info' ? 'info' 
        : data?.variant === 'warning' ? 'warning' 
        : data?.variant === 'danger' ? 'danger' 
        : 'info';
    const styles = variantStyles[variant] || variantStyles.info;
    const isLight = theme === 'light';

    return (
        <div
            role="alert"
            className={`fixed right-4 bottom-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto max-w-md z-[10050] transition-all duration-300 ease-out ${
                isLeaving 
                    ? 'translate-x-full opacity-0 sm:translate-x-[120%]' 
                    : hasEntered 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-4 opacity-0'
            }`}
        >
            <div
                className={`
                    relative overflow-hidden rounded-xl border border-l-4 shadow-lg
                    ${isLight ? styles.light : styles.dark}
                    ${isLight ? 'border-gray-200' : 'border-[#2B2B2B]'}
                `}
            >
                <div className="flex items-center gap-3 px-5 py-4">
                    <span className={`flex-shrink-0 ${isLight ? styles.iconLight : styles.iconDark}`}>
                        <FontAwesomeIcon icon={styles.icon} className="text-xl" />
                    </span>
                    <p className="text-sm sm:text-base font-medium leading-snug flex-1 min-w-0">
                        {data?.message}
                    </p>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Dismiss"
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                            isLight 
                                ? 'hover:bg-black/5 text-gray-500 hover:text-gray-700' 
                                : 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                </div>
                <div 
                    className={`h-1 ${styles.bar} transition-all duration-75 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default Notification;
