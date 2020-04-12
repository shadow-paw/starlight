export interface IGestureDetector {
    touchStart(ev: TouchEvent): void;
    touchEnd(ev: TouchEvent): void;
    touchCancel(ev: TouchEvent): void;
    touchMove(ev: TouchEvent): void;
}
