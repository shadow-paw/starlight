export interface InputHandler {
    onMouseDown(ev: MouseEvent): void;
    onMouseUp(ev: MouseEvent): void;
    onMouseMove(ev: MouseEvent): void;
    onMouseWheel(ev: WheelEvent): void;
    onMouseClick(button: number): void;

    onTouchStart(ev: TouchEvent): void;
    onTouchEnd(ev: TouchEvent): void;
    onTouchCancel(ev: TouchEvent): void;
    onTouchMove(ev: TouchEvent): void;
}
