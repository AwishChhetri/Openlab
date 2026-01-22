import { usePendingRequests } from '../../hooks/usePendingRequests';
import { useEffect, useState } from 'react';

export const ProgressBar = () => {
    const isLoading = usePendingRequests((state) => state.isLoading);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timeout: any;
        if (isLoading) {
            setVisible(true);
        } else {
            // Slight delay before hiding to avoid flickering for very fast requests
            timeout = setTimeout(() => setVisible(false), 300);
        }
        return () => clearTimeout(timeout);
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-transparent">
            <div
                className={`h-full bg-[#00A854] shadow-[0_0_10px_#00A854] transition-all duration-500 ease-out ${isLoading ? 'w-1/2 animate-pulse-fast' : 'w-full'}`}
                style={{
                    transitionProperty: 'width, opacity',
                    width: isLoading ? '70%' : '100%',
                    opacity: isLoading ? 1 : 0
                }}
            />
        </div>
    );
};
