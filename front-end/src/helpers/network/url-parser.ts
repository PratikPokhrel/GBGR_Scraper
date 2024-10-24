
export const getFullStringUrl = (url: string, param: any) => {
    let entries = param ? Object.entries(param) : null;
    let fullUrl = url;
    entries =
        entries &&
        entries.filter((entry) => {
            if (entry[1] != null || entry[1] != undefined) {
                return entry;
            }
        });
    entries &&
        entries.map((entry, ind) => {
            if (ind == 0) {
                fullUrl = `${fullUrl}?${`${entry[0]}=${entry[1]}`}`;
            } else {
                fullUrl = `${fullUrl}&${`${entry[0]}=${entry[1]}`}`;
            }
        });
    return fullUrl;
};