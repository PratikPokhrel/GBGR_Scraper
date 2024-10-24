const controller = {
    name: 'authentication'
}
const { REACT_APP_BASE_URL } = process.env;

export const auth = {
    login: `${REACT_APP_BASE_URL}${controller.name}/token`,
    refresh: `${REACT_APP_BASE_URL}${controller.name}/refresh`,
}