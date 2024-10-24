export interface ISliderProps {
    show: boolean;
    header ?: any;
    handleClose: Function;
    children?: any;
    placement? : "top" | "bottom" | "start" |"end"
}