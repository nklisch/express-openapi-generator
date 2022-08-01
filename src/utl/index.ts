let clone = (obj: any): any => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (obj === undefined || obj === null) {
        return obj;
    }
    return JSON.parse(JSON.stringify(obj));
};
if (parseInt(process.versions.node.split('.')[0], 10) >= 18) {
    clone = structuredClone;
}
export default clone;