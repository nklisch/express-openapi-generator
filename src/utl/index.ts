let clone = structuredClone || undefined;
if (!clone) {
    clone = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj))
    }
}
export default clone;