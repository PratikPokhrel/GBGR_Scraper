import { iconName } from "../icon/iIconProp";

export interface IButtonProps {
    title?: string;
    type?: string;
    size?: "small" | "medium" | "large";
    loading?: boolean;
    onClick?: Function;
    disabled?: boolean;
    iconLeft?: iconName;
    iconRight?: iconName;
    buttonHtmlType: "button" | "submit";
    bg?:
    | "primary"
    | "primary-light"
    | "primary-dark"
    | "danger"
    | "danger-dark"
    | "danger-light"
    | "primary-light-2"
    | "warning"
    | "green"
    | "green-dark"
    | "secondary-light"
    | "secondary"
    | "secondary-dark"
    | "success"
    | "info"
    | "light"
    | "dark"
}