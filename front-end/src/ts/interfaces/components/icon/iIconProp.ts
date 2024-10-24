export type iconName = "plus"
    | "edit"
    | "circle"
    | "trash"
    | "arrow-right"
    | "arrow-left"
    | "ellipse-v"
    | "search"
    | "comment"
    | "check"
    | "download"
    | "reset"

export type SizeProp =
    | "2xs"
    | "xs"
    | "sm"
    | "lg"
    | "xl"
    | "2xl"
    | "1x"
    | "2x"
    | "3x"
    | "4x"
    | "5x"
    | "6x"
    | "7x"
    | "8x"
    | "9x"
    | "10x";

export interface IIconProp {
    name: iconName;
    height?: number;
    width?: number;
    color?: string;
    spin?: boolean;
    size?: SizeProp;

}