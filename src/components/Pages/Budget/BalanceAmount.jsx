import React from 'react'

const BalanceAmount = ({ visible, children, maskedText = '₱ ----', className = '' }) => (
    <span className={`relative inline-grid align-middle ${className}`}>
        <span
            aria-hidden={!visible}
            className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                visible ? 'opacity-100 blur-0 translate-y-0 scale-100' : 'opacity-0 blur-[5px] -translate-y-0.5 scale-95 pointer-events-none select-none'
            }`}
        >
            {children}
        </span>
        <span
            aria-hidden={visible}
            className={`col-start-1 row-start-1 tabular-nums transition-all duration-300 ease-out ${
                visible ? 'opacity-0 blur-[5px] translate-y-0.5 scale-95 pointer-events-none select-none' : 'opacity-100 blur-0 translate-y-0 scale-100'
            }`}
        >
            {maskedText}
        </span>
    </span>
)

export default BalanceAmount
