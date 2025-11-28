
import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RestartIcon } from './icons/RestartIcon';

// Menggunakan sumber gambar High-Res dari Unsplash (CDN cepat) untuk memaksimalkan bandwidth
const DOWNLOAD_TEST_URL = 'https://images.unsplash.com/photo-1558486012-817176f84c6d?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=4000&fit=max';
const UPLOAD_TEST_URL = 'https://httpbin.org/post';

interface SpeedMetric {
    value: number;
    unit: string;
    isDone: boolean;
}

const NetworkTestScreen: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState<'idle' | 'pinging' | 'downloading' | 'uploading' | 'complete'>('idle');
    
    // Metrics State
    const [ping, setPing] = useState<SpeedMetric>({ value: 0, unit: 'ms', isDone: false });
    const [download, setDownload] = useState<SpeedMetric>({ value: 0, unit: 'Mbps', isDone: false });
    const [upload, setUpload] = useState<SpeedMetric>({ value: 0, unit: 'Mbps', isDone: false });
    
    // Realtime progress for visual bars (0-100)
    const [progress, setProgress] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    // --- UTILS ---
    const formatSpeed = (bitsPerSecond: number) => {
        const mbps = bitsPerSecond / 1000000; // Mengubah bit ke Megabit
        return parseFloat(mbps.toFixed(2));
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // --- PING TEST (AVG 5x) ---
    const runPingTest = async () => {
        setStatus('pinging');
        setProgress(0);
        
        let totalTime = 0;
        const attempts = 5;

        for (let i = 0; i < attempts; i++) {
            const start = performance.now();
            try {
                // Fetch header only, cache-busting to prevent browser caching
                await fetch(`${window.location.origin}/?ping=${Date.now()}-${Math.random()}`, { 
                    method: 'HEAD', 
                    cache: 'no-store' 
                });
                const end = performance.now();
                totalTime += (end - start);
                
                // Update realtime intermmediate average
                setPing({ value: Math.round(totalTime / (i + 1)), unit: 'ms', isDone: false });
                setProgress(((i + 1) / attempts) * 100);
                await sleep(50); // Slight delay between pings
            } catch (e) {
                console.warn("Ping failed", e);
            }
        }

        const avg = Math.round(totalTime / attempts);
        setPing({ value: avg, unit: 'ms', isDone: true });
    };

    // --- DOWNLOAD TEST (Multi-Stream) ---
    const runDownloadTest = async () => {
        setStatus('downloading');
        setProgress(0);
        setDownload({ value: 0, unit: 'Mbps', isDone: false });

        const DURATION = 10000; // 10 seconds test
        const CONCURRENT_STREAMS = 4; // Menggunakan 4 koneksi paralel untuk saturasi bandwidth
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const startTime = performance.now();
        let totalBytesLoaded = 0;
        let activeStreams = 0;

        // Fungsi worker untuk satu stream
        const downloadWorker = async () => {
            activeStreams++;
            while (performance.now() - startTime < DURATION && !signal.aborted) {
                try {
                    // Cache busting random query param
                    const response = await fetch(`${DOWNLOAD_TEST_URL}&rnd=${Math.random()}`, {
                        signal,
                        cache: 'no-store'
                    });

                    if (!response.body) break;
                    const reader = response.body.getReader();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        if (value) {
                            totalBytesLoaded += value.byteLength;
                        }
                        
                        // Cek waktu setiap chunk untuk menghentikan loop internal jika waktu habis
                        if (performance.now() - startTime >= DURATION) {
                            reader.cancel();
                            break;
                        }
                    }
                } catch (e: any) {
                    if (e.name !== 'AbortError') console.warn("Stream error", e);
                    break;
                }
            }
            activeStreams--;
        };

        // UI Update Loop (terpisah dari worker download agar tidak membebani proses fetch)
        const uiInterval = setInterval(() => {
            const currentTime = performance.now();
            const elapsedTime = (currentTime - startTime) / 1000; // seconds
            
            if (elapsedTime > 0) {
                const bitsLoaded = totalBytesLoaded * 8;
                const currentBps = bitsLoaded / elapsedTime;
                setDownload({ value: formatSpeed(currentBps), unit: 'Mbps', isDone: false });
                
                const timeProgress = Math.min(100, (elapsedTime / (DURATION / 1000)) * 100);
                setProgress(timeProgress);
            }

            if ((currentTime - startTime >= DURATION) || signal.aborted) {
                clearInterval(uiInterval);
            }
        }, 100);

        // Jalankan worker secara paralel
        const workers = Array.from({ length: CONCURRENT_STREAMS }).map(() => downloadWorker());
        
        await Promise.all(workers);
        clearInterval(uiInterval);

        // Final Calculation
        const finalTime = (performance.now() - startTime) / 1000;
        const finalBps = (totalBytesLoaded * 8) / finalTime;
        setDownload({ value: formatSpeed(finalBps), unit: 'Mbps', isDone: true });
    };

    // --- UPLOAD TEST (XHR for Progress) ---
    const runUploadTest = async () => {
        setStatus('uploading');
        setProgress(0);
        setUpload({ value: 0, unit: 'Mbps', isDone: false });

        return new Promise<void>((resolve) => {
            // Generate 10MB of random binary data (Payload lebih besar untuk high speed)
            const sizeInBytes = 10 * 1024 * 1024; 
            const buffer = new ArrayBuffer(sizeInBytes);
            // Isi sedikit data acak agar tidak dikompresi berlebihan oleh network
            const view = new Uint8Array(buffer);
            for(let i=0; i<view.length; i+=1000) view[i] = Math.random() * 255;
            
            const blob = new Blob([buffer], { type: 'application/octet-stream' });

            const xhr = new XMLHttpRequest();
            const startTime = performance.now();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const currentTime = performance.now();
                    const elapsedTime = (currentTime - startTime) / 1000; // seconds
                    
                    if (elapsedTime > 0) {
                        const bitsLoaded = event.loaded * 8;
                        const currentBps = bitsLoaded / elapsedTime;
                        setUpload({ value: formatSpeed(currentBps), unit: 'Mbps', isDone: false });
                    }

                    const percentComplete = (event.loaded / event.total) * 100;
                    setProgress(percentComplete);
                }
            };

            const finish = () => {
                const finalTime = (performance.now() - startTime) / 1000;
                // Gunakan bytes yang benar-benar terkirim atau ukuran total jika sukses
                const finalBps = (sizeInBytes * 8) / finalTime;
                setUpload({ value: formatSpeed(finalBps), unit: 'Mbps', isDone: true });
                resolve();
            };

            xhr.onload = finish;
            xhr.onerror = finish; // Selesaikan test meskipun error (seringkali CORS pada HTTPBin, tapi speed upload tetap terukur)
            xhr.onabort = finish;

            xhr.open('POST', UPLOAD_TEST_URL, true);
            xhr.send(blob);
        });
    };

    const startTest = async () => {
        if (isRunning) return;
        setIsRunning(true);
        
        // Reset
        setPing({ value: 0, unit: 'ms', isDone: false });
        setDownload({ value: 0, unit: 'Mbps', isDone: false });
        setUpload({ value: 0, unit: 'Mbps', isDone: false });

        try {
            await runPingTest();
            await runDownloadTest();
            await runUploadTest();
        } catch (error) {
            console.error("Test failed", error);
        } finally {
            setStatus('complete');
            setIsRunning(false);
            setProgress(100);
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const getStatusText = () => {
        switch(status) {
            case 'pinging': return 'Testing Latency...';
            case 'downloading': return 'Testing Download (Multi-stream)...';
            case 'uploading': return 'Testing Upload (10MB)...';
            case 'complete': return 'Test Complete';
            default: return 'Ready to Test';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] text-center">
                <h3 className="text-2xl font-bebas tracking-wider text-[var(--color-text-primary)] mb-6">Realtime Network Speed</h3>
                
                {/* Visual Gauge Area */}
                <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
                    
                    {/* Ping Card */}
                    <div className={`p-4 rounded-xl border-2 w-full md:w-1/3 transition-all ${status === 'pinging' ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 scale-105' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]'}`}>
                        <p className="text-[var(--color-text-secondary)] font-bold text-sm mb-2 uppercase tracking-wide">PING</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className={`text-4xl md:text-5xl font-mono font-bold ${ping.value > 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {ping.value}
                            </span>
                            <span className="text-[var(--color-text-muted)]">ms</span>
                        </div>
                    </div>

                    {/* Download Card */}
                    <div className={`p-4 rounded-xl border-2 w-full md:w-1/3 transition-all ${status === 'downloading' ? 'border-[var(--color-info)] bg-[var(--color-info)]/10 scale-105' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]'}`}>
                        <div className="flex items-center justify-center gap-2 mb-2 text-[var(--color-text-secondary)]">
                            <DownloadIcon />
                            <p className="font-bold text-sm uppercase tracking-wide">DOWNLOAD</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-[var(--color-info)]">
                                {download.value}
                            </span>
                            <span className="text-[var(--color-text-muted)]">Mbps</span>
                        </div>
                    </div>

                    {/* Upload Card */}
                    <div className={`p-4 rounded-xl border-2 w-full md:w-1/3 transition-all ${status === 'uploading' ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]'}`}>
                        <div className="flex items-center justify-center gap-2 mb-2 text-[var(--color-text-secondary)]">
                            <UploadIcon />
                            <p className="font-bold text-sm uppercase tracking-wide">UPLOAD</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-purple-400">
                                {upload.value}
                            </span>
                            <span className="text-[var(--color-text-muted)]">Mbps</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {isRunning && (
                    <div className="w-full max-w-xl mx-auto mb-6">
                        <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
                            <span>{getStatusText()}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-4 overflow-hidden border border-[var(--color-border-secondary)]">
                            <div 
                                className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-info)] transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {!isRunning && (
                    <button
                        onClick={startTest}
                        className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-4 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 mx-auto"
                    >
                        <RestartIcon />
                        {status === 'idle' ? 'Start Speed Test' : 'Test Again'}
                    </button>
                )}
                
                {status === 'complete' && (
                    <div className="mt-6 text-sm text-[var(--color-text-muted)]">
                        <p>Test completed. Results based on your browser connection to CDN.</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-[var(--color-bg-tertiary)]/30 rounded-lg border border-[var(--color-border-secondary)] text-left text-xs text-[var(--color-text-muted)]">
                <p><strong>Technical Details:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ping: Average of 5 requests.</li>
                    <li>Download: 4 Parallel Streams (Unsplash CDN) for 10 seconds.</li>
                    <li>Upload: 10MB payload upload to HTTPBin.</li>
                </ul>
            </div>
        </div>
    );
};

export default NetworkTestScreen;
