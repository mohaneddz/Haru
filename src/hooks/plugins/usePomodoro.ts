import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

export default function usePomodoro() {
	const [isActive, setIsActive] = createSignal(false);
	const [timeLeft, setTimeLeft] = createSignal(3600);
	const [intervalId, setIntervalId] = createSignal<NodeJS.Timeout | null>(null);

	const navigate = useNavigate();

	const formatTimeLeft = () => {
		const minutes = Math.floor(timeLeft() / 60);
		const secs = timeLeft() % 60;
		return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	};

	const handleBackClick = () => {
		navigate(-1);
	};

	const handleStop = () => {
		setIsActive(false);
		setTimeLeft(3600);
        if (intervalId()) {
            clearInterval(intervalId()!);
            setIntervalId(null);
        }
	};

	const handlePlay = () => {
        if (isActive()) {
            setIsActive(false);
            if (intervalId()) {
                clearInterval(intervalId()!);
                setIntervalId(null);
            }   
        }
        else {
            setIsActive(true);
            setIntervalId(setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0) {
                        clearInterval(intervalId()!);
                        setIsActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000));
        }
	};


	return { handleBackClick, handlePlay, isActive, timeLeft, setTimeLeft, formatTimeLeft, handleStop };
}
