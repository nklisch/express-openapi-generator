let clone = structuredClone;
if (parseInt(process.versions.node.split('.')[0], 10) < 16) {
    clone = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj))
    }
}
export default clone;