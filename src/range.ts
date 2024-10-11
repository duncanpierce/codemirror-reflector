export class Range {
    constructor(readonly from: number, readonly to: number) { }

    clip(other: Range): Range {
        return new Range(Math.max(this.from, other.from), Math.min(this.to, other.to))
    }

    empty(): boolean {
        return this.from === this.to
    }

    subtract(other: Range): readonly Range[] {
        other = this.clip(other)
        return [new Range(this.from, other.from), new Range(other.to, this.to)].filter(r => !r.empty())
    }

    subtractAll(ranges: readonly Range[]): readonly Range[] {
        let results: Range[] = [this]
        for (let range of ranges) {
            results = results.flatMap(result => result.subtract(range))
        }
        return results
    }
}