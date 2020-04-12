import { IGestureDetector } from "./idetector";

interface GestureDetectorTouchRecord {
    identifier: number;
    x: number;
    y: number;
}
interface GestureDetectorTouchVector {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}
interface GestureDetectorTouchPoint {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    movements: GestureDetectorTouchVector[];
}
export class SimpleGestureDetector implements IGestureDetector {
    private records: GestureDetectorTouchRecord[] = [];
    private isClick: boolean = false;
    private isReleased: boolean = false;
    private clickPoints: number = 0;

    onClick?: (points: number) => void;
    onDrag?: (dx: number, dy: number) => void;
    onPan?: (dx: number, dy: number) => void;
    onZoom?: (delta: number) => void;

    touchStart(ev: TouchEvent): void {
        if (this.records.length === 0) {
            this.isClick = true;
            this.clickPoints = 0;
            this.isReleased = false;
        }
        if (this.isReleased) {
            this.isClick = false;
        }
        for (const touch of ev.changedTouches) {
            this.records.push({
                identifier: touch.identifier,
                x: touch.pageX,
                y: touch.pageY,
            });
            this.clickPoints ++;
        }
    }
    touchEnd(ev: TouchEvent): void {
        this.isReleased = true;
        for (const touch of ev.changedTouches) {
            this.records = this.records.filter(o => o.identifier !== touch.identifier);
        }
        if (this.records.length === 0 && this.isClick) {
            if (this.onClick) this.onClick(this.clickPoints);
        }
    }
    touchCancel(ev: TouchEvent): void {
        this.records = [];
    }
    touchMove(ev: TouchEvent): void {
        const points: GestureDetectorTouchPoint[] = [];
        for (const record of this.records) {
            points.push({
                startX: record.x,
                startY: record.y,
                endX: record.x,
                endY: record.y,
                movements: []
            });
        }
        for (const touch of ev.changedTouches) {
            const index = this.records.findIndex(o => o.identifier === touch.identifier);
            if (index === -1) continue;
            points[index].movements.push({
                fromX: this.records[index].x,
                fromY: this.records[index].y,
                toX: touch.pageX,
                toY: touch.pageY,
            });
            this.records[index].x = touch.pageX;
            this.records[index].y = touch.pageY;
            points[index].endX = touch.pageX;
            points[index].endY = touch.pageY;
        }
        this.detect(points);
    }
    private detect(points: GestureDetectorTouchPoint[]): boolean {
        if (this.detectMoved(points)) {
            this.isClick = false;
        }
        if (points.length === 1) {
            if (this.detectDrag(points)) return true;
            return false;
        } else if (points.length === 2) {
            if (this.detectZoom(points)) return true;
            if (this.detectPan(points)) return true;
            return false;
        }
        return false;
    }
    private detectMoved(points: GestureDetectorTouchPoint[]): boolean {
        for (const point of points) {
            for (const movement of point.movements) {
                const dx = movement.toX - movement.fromX;
                const dy = movement.toY - movement.fromY;
                const ds2 = dx * dx + dy * dy;
                if (ds2 > 100) return true;
            }
        }
        return false;
    }
    private detectDrag(points: GestureDetectorTouchPoint[]): boolean {
        let dragged = false;
        for (const movement of points[0].movements) {
            const dx = movement.toX - movement.fromX;
            const dy = movement.toY - movement.fromY;
            const ds2 = dx * dx + dy * dy;
            if (ds2 > 100) {
                if (this.onDrag) this.onDrag(dx, dy);
                dragged = true;
            }
        }
        return dragged;
    }
    private detectZoom(points: GestureDetectorTouchPoint[]): boolean {
        const dxStart = points[0].startX - points[1].startX;
        const dyStart = points[0].startY - points[1].startY;
        const dxEnd = points[0].endX - points[1].endX;
        const dyEnd = points[0].endY - points[1].endY;
        const dsStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
        const dsEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);
        const changes = dsStart - dsEnd;
        if (Math.abs(changes) >= 10) {
            if (this.onZoom) this.onZoom(changes);
            return true;
        }
        return false;
    }
    private detectPan(points: GestureDetectorTouchPoint[]): boolean {
        const dx0 = points[0].endX - points[0].startX;
        const dy0 = points[0].endY - points[0].startY;
        const dx1 = points[1].endX - points[1].startX;
        const dy1 = points[1].endY - points[1].startY;
        let panned = false;
        if (dy0 === 0) {
            if (dy1 === 0) panned = true;
        } else if (dy1 !== 0) {
            const slope0 = dx0 / dy0;
            const slope1 = dx1 / dy1;
            if (Math.abs(slope0 - slope1) < 5) {
                const ds0 = dx0 * dx0 + dy0 + dy0;
                const ds1 = dx1 * dx1 + dy1 + dy1;
                if (ds0 > 10 && ds1 > 10) panned = true;
            }
        }
        if (panned && this.onPan) this.onPan(dx0, -dy0);
        return panned;
    }
}
