import classNames from "classnames";
import { IButtonProps } from "../../ts/interfaces/components/button/iButton-props";
import Icons from "../icons";

const AppButton = (props: IButtonProps) => {

    const onClick = () => props.onClick && props.onClick();

    const type = props.type == 'btn' ? 'btn' : '';
    const buttonClasses = classNames({
        [type]: true,
        [type + "-primary"]: props.bg === "primary",
        [type + "-secondary"]: props.bg === "secondary",
        [type + "-success"]: props.bg === "success",
        [type + "-danger"]: props.bg === "danger",
        [type + "-warning"]: props.bg === "warning",
        [type + "-info"]: props.bg === "info",
        [type + "-light"]: props.bg === "light",
        [type + "-dark"]: props.bg === "dark",
        [type + "-sm"]: props.size === "small",
        [type + "-lg"]: props.size === "large",
    });

    return (
        <button type={props.buttonHtmlType}
            className={buttonClasses}
            disabled={props.disabled}
            onClick={onClick}>
            {props.iconLeft && !props.loading && <span> <Icons name={props.iconLeft} spin={props.loading} /> </span>}
            {props.title}
            {props.loading && <span>   <Icons name="circle" spin={props.loading} /> </span>}
            {props.iconRight && !props.loading && <span> <Icons name={props.iconRight} spin={props.loading} /> </span>}
        </button>
    )
}

AppButton.defaultProps = {
    size: "medium",
    bg: "primary",
    type: "btn",
    buttonType: "normal",
    buttonHtmlType: "button", //submit //reset
    justDrop: false,
    isDisabled: false,
    loading: false,
    buttonClass: "",
    withShadow: false,
    withIcon: false,
    withDrop: false,
    enableLoader: false,
    stopLoading: false,
};

export default AppButton;