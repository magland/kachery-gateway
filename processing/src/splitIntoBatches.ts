function splitIntoBatches(x: any[], batchSize: number): any[][] {
    const ret: any[][] = []
    let i = 0
    while (i < x.length) {
        ret.push(x.slice(i, i + batchSize))
        i += batchSize
    }
    return ret
}

export default splitIntoBatches