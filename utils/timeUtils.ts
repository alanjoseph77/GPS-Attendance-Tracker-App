
export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
        .map(v => v < 10 ? "0" + v : v.toString())
        .join(":");
};

export const getDayKey = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
};

export const calculateSessionDuration = (enterTime: string, exitTime?: string): number => {
    const start = new Date(enterTime).getTime();
    const end = exitTime ? new Date(exitTime).getTime() : new Date().getTime();
    return Math.floor((end - start) / 1000);
};
export const getTimeAgo = (dateStr: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
};
