let clone = <Type>(obj: Type): Type => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (obj === undefined || obj === null) {
        return obj;
    }
    return JSON.parse(JSON.stringify(obj)) as Type;
};
if (parseInt(process.versions.node.split('.')[0], 10) >= 18) {
    clone = structuredClone;
}
export default clone;
