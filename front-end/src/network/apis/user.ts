const controller = {
    name: 'users'
}
const { REACT_APP_BASE_URL } = process.env;

export const user = {
    getUsersDropDown: `${REACT_APP_BASE_URL}${controller.name}/drop-down`,
}