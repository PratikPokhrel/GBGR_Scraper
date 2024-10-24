const controller = {
    name: 'roles'
}
const { REACT_APP_BASE_URL } = process.env;

export const role = {
    getRoles: `${REACT_APP_BASE_URL}${controller.name}`,
}