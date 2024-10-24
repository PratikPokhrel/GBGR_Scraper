import axios from "axios";
import { getFullStringUrl } from "../helpers/network/url-parser";

export const axiosPrivate = axios.create({
    headers: { 'Content-Type': 'application/json',
 },
    withCredentials: false
});

export default axios.create({
    baseURL: `http://127.0.0.1:5001/v1/`,
});


/**
 * The service method for API 'GET' methos
 * @param url The api url
 * @param param The  param
 * @param showResponseMessage Indicates whether to show response message.
 * @returns The response.
**/
export const get = (url: string, param: any = null, showResponseMessage: boolean = false) => {
    return new Promise(async (resolve, reject) => {
        const fullUrl = getFullStringUrl(url, param);
        await axiosPrivate
            .get(fullUrl)
            .then((res) => onSuccess(resolve, reject, res, showResponseMessage, undefined))
            .catch((err) => onFailure(resolve, reject, err));
    });
};


/**
 * The service method for API 'POST' method
 * @param url The api url
 * @param param The post param
 * @param callBack The callback function
 * @param showResponseMessage Indicates whether to show response message.
 * @param isMultipart Indicates whether to the request is multipart.
 * @returns The response.
**/
export const post = (url: string, params: any, callBack?: Function, showResponseMessage: boolean = true, isMultipart: boolean = false) => {
    return new Promise(async (resolve, reject) => {
        await axiosPrivate
            .post(url, params, {withCredentials: true})
            .then((res) => onSuccess(resolve, reject, res, showResponseMessage, callBack))
            .catch((err) => onFailure(resolve, reject, err));
    });
};

/**
 * The service method for API 'PUT' method
 * @param url The api url
 * @param param The post param
 * @param callBack The callback function
 * @param showResponseMessage Indicates whether to show response message.
 * @param isMultipart Indicates whether to the request is multipart.
 * @returns The response.
**/
export const put = (url: string, param: any, showResponseMessage: boolean = true, isMultipart: boolean = false) => {
    return new Promise(async (resolve, reject) => {
        await axiosPrivate
            .put(url, param)
            .then((res) => onSuccess(resolve, reject, res, showResponseMessage))
            .catch((err) => onFailure(resolve, reject, err));
    });
};



/**
 * The service method for API 'DELETE' method
 * @param url The api url.
 * @param id The entity id.
 * @param callBack The callback function.
 * @param showResponseMessage Indicates whether to show response message.
 * @returns The response.
**/

export const deletion = (url: string, id: any, callBack?: Function, showResponseMessage: boolean = true) => {
    return new Promise(async (resolve, reject) => {
        const fullUrl = `${url}/${id}`;
        await axiosPrivate
            .delete(fullUrl)
            .then((res) => onSuccess(resolve, reject, res, showResponseMessage, callBack))
            .catch((err) => onFailure(resolve, reject, err));
    });
};

/**
 * The Promise success resolver
 * @param resolve The resolve function.
 * @param reject The reject function.
 * @param res  The API response.
 * @param showResponseMessage Indicates whether the show response message.
 * @param callBack The call back function
 */
const onSuccess = async (resolve: any, reject: any, res: any, showResponseMessage: boolean, callBack?: Function) => {
    const response = res.data;
    if (response.Status == true || response.succeeded === true) {
        if (showResponseMessage) {
            // notifySuccess(response.messages[0]);
            callBack && callBack();
        }
        resolve(response);
    } else if (response.succeeded === false || response.Status === false) {
        if (showResponseMessage) {
            // notifyError(response.messages[0]);
        }
        resolve(response);
    } else if (response.Status == undefined || response.status == undefined) {
        if (res.status == 200) {
            resolve(response);
        } else {
            // dispatchMessage(dispatch, "Response status is not 200");
            resolve(null);
        }
    }
};

const onFailure = async (resolve: any, reject: any, err: any) => {
    // dispatchMessage(dispatch, err.message);
    resolve(null);

    if (err.response &&err.response.status == 401) {
        // window.location.href = window.location.origin + routes.common.login;
        // history.replace(routes.common.login);
    }
};


