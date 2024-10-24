import { faEdit, faPlus, IconDefinition, faTrash,faDownload, faComment, faSpinner, faArrowRight, faSearch, faEllipsisV, faCheckCircle, faCheck, faArrowLeft, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconName, IIconProp } from "../../ts/interfaces/components/icon/iIconProp";

const Icons = (props: IIconProp) => {
    const icon = getIconType(props.name);
    return (<FontAwesomeIcon icon={icon} size={props.size}  {...props} />)
}

Icons.defaultProps = {
    color: "#fff",
    height: 20,
    width: 20,
    spin: false
}


function getIconType(name: iconName): IconDefinition {
    switch (name) {
        case "plus":
            return faPlus;
        case "edit":
            return faEdit
        case "circle":
            return faSpinner;
        case "trash":
            return faTrash;
        case "arrow-right":
            return faArrowRight;
            case "arrow-left":
                return faArrowLeft;
        case "search":
            return faSearch;
        case "ellipse-v":
            return faEllipsisV;
        case "comment":
            return faComment;
        case "check":
            return faCheck;
        case "download":
            return faDownload;
         case "reset":
                return faRefresh;
        default:
            return faPlus;
    }
}

export default Icons;