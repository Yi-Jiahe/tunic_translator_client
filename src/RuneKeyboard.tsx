import React, { useState, useRef } from 'react';
import './RuneKeyboard.css';
import Rune from './Rune';
import { Points, PointPairsToSegments } from './consts';


interface RuneInputProps {
    handleSpace: (rune: Set<number>) => void,
    handleBackspace: () => void,
    handleEnter: (rune: Set<number>) => void,
}

export default function RuneKeyboard(props: RuneInputProps) {
    const [pointerIsDown, setPointerIsDown] = useState(false);
    const [path, setPath] = useState<number[]>([]);
    const [segments, setSegments] = useState<Set<number>[]>([]);
    const [hidden, setHidden] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fontSize = 40;
    const points = Points.map((point) => [point[0] * fontSize, point[1] * fontSize])
    const radius = 15;
    const canvasWidth = 180;
    const canvasHeight = 250;

    const canvasDraw = (x: number, y: number) => {
        if (canvasRef === null) { return; }
        const canvas = canvasRef.current;
        if (canvas === null) { return; }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx === null) { return; }
        var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

        const drawPixel = (x: number, y: number, r: number, g: number, b: number, a: number) => {
            var index = (x + y * canvasWidth) * 4;
            
            canvasData.data[index + 0] = r;
            canvasData.data[index + 1] = g;
            canvasData.data[index + 2] = b;
            canvasData.data[index + 3] = a;
        }

        for (let i=0; i<5; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const r = Math.random() * radius;
            const pixelX = Math.floor(x + canvasWidth/2 + r * Math.cos(theta));
            if (pixelX < 0 || pixelX > canvasWidth) { continue; }
            const pixelY = Math.floor(y + canvasHeight/2 + r * Math.sin(theta));
            if (pixelY < 0 || pixelY > canvasHeight) { continue; }

            drawPixel(
                pixelX, pixelY, 0, 0, 0, Math.floor((1 - (r / radius)) * 255));
        }

        ctx.putImageData(canvasData, 0, 0);
    }

    const clearCanvas = () => {
        if (canvasRef === null) { return; }
        const canvas = canvasRef.current;
        if (canvas === null) { return; }

        const ctx = canvas.getContext('2d');
        if (ctx === null) { return; }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    const checkPoint = (e: React.MouseEvent<HTMLDivElement> | React.Touch) => {
        if (!(e.target instanceof HTMLDivElement)) return;

        const offset = {
            left: e.target.offsetLeft,
            top: e.target.offsetTop
        };

        let reference = e.target.offsetParent;
        while (reference instanceof HTMLDivElement) {
            offset.left += reference.offsetLeft;
            offset.top += reference.offsetTop;
            reference = reference.offsetParent;
        }

        const localX = e.clientX - offset.left;
        const localY = e.clientY - offset.top;
        // console.log('local position', localX, localY);

        canvasDraw(localX, localY);

        const touchedPoints = points.map((point, i) => {
            if (i >= 8 && i < 12) { return null; }
            let dx = Math.abs(point[0] - localX);
            let dy = Math.abs(point[1] - localY);
            if (Math.sqrt(dx * dx + dy * dy) <= radius) { return i }
            return null;
        }).filter((e) => e !== null);

        if (touchedPoints.length !== 1) { return; }

        const point = touchedPoints[0];
        if (point === null) { return; }

        if (point !== path[path.length - 1]) {
            setPath([...path, point]);
        }
    }

    const up = () => {
        clearCanvas();

        console.log(path);
        const newSegments = new Set<number>();

        let lastPoint: number;
        path.forEach((point) => {
            if (point === 12) {
                newSegments.add(12);
                return;
            }
            if (lastPoint !== undefined) {
                const segment = PointPairsToSegments[[lastPoint, point].sort().toString()]
                if (segment !== undefined) { newSegments.add(segment); }
            }
            lastPoint = point;
        });

        setPath([]);

        if (newSegments.size > 0) {
            setSegments([...segments, newSegments]);
            console.log(segments)
        }
    }

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!(e.target instanceof HTMLDivElement)) return;
        console.log("onMouseDown");
        setPointerIsDown(true);

        checkPoint(e);
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!pointerIsDown) return;

        checkPoint(e);
    };

    const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        console.log('onMouseUp');

        setPointerIsDown(false);

        up();
    }

    const onTouchStart = (e: React.TouchEvent) => {
        console.log("onTouchStart");
        checkPoint(e.touches[0]);
    }

    const onTouchMove = (e: React.TouchEvent) => {
        checkPoint(e.touches[0]);
    }

    const onTouchEnd = (e: React.TouchEvent) => {
        console.log("onTouchEnd");
        up();
    }


    const onUndoClick = () => {
        setSegments(segments.slice(0, -1));
    }

    return (
        <div id="rune-keyboard"
            className={hidden ? 'hide' : 'show'} >
            <button className='toggle-keyboard-button'
                onClick={e => {
                    setHidden(!hidden);
                }}>
                {hidden ? '∧' : '∨'}</button>
            <div className='keyboard-main'>
                <div className='right-bar' />
                <div>
                    <div className='rune-input'>
                        <Rune className='visual'
                            fontSize={fontSize}
                            drawPoints
                            segments={segments.reduce((p, c) => new Set([...Array.from(p), ...Array.from(c)]), new Set([]))}
                        />
                        <canvas className='path-canvas touch-area' ref={canvasRef} 
                            width={canvasWidth} height={canvasHeight}/>
                        <div className='input-capturer touch-area'
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}

                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        />
                    </div>
                    <button className='space-bar'
                        onClick={e => {
                            props.handleSpace(segments.reduce((p, c) => new Set([...Array.from(p), ...Array.from(c)]), new Set([])));
                            setSegments([]);
                        }}>⎵</button>
                </div>
                <div className='side-bar'>
                    <button className='backspace-button'
                        onClick={e => {
                            props.handleBackspace();
                            setSegments([]);
                        }}>←</button>
                    <button className='undo-button'
                        onClick={onUndoClick}>⟲</button>
                    <button className='enter-button'
                        onClick={e => {
                            props.handleEnter(segments.reduce((p, c) => new Set([...Array.from(p), ...Array.from(c)]), new Set([])));
                            setSegments([]);
                        }}>↩</button>
                    <button className='cancel-button'
                        onClick={e => { setSegments([]); }}>⨉</button>
                </div>
            </div>
        </div>);
}