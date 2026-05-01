export type Mat3 = [
    number, number, number,
    number, number, number,
    number, number, number
];
export interface Point2D { x: number, y: number }
export const EPS = 1e-10;

export const mat3 = {
    identity(): Mat3 {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    },
    multiply(a: Mat3, b: Mat3): Mat3 {
        const res = [0, 0, 0, 0, 0, 0, 0, 0, 0] as Mat3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                res[i * 3 + j] = a[i * 3 + 0] * b[0 * 3 + j] +
                                 a[i * 3 + 1] * b[1 * 3 + j] +
                                 a[i * 3 + 2] * b[2 * 3 + j];
            }
        }
        return res;
    },
    translate(tx: number, ty: number): Mat3 {
        return [1, 0, tx, 0, 1, ty, 0, 0, 1];
    },
    scale(sx: number, sy: number): Mat3 {
        return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    },
    rotate(rad: number): Mat3 {
        const c = Math.cos(rad), s = Math.sin(rad);
        return [c, -s, 0, s, c, 0, 0, 0, 1];
    },
    fromTransform(tx: number, ty: number, rot: number, sx: number, sy: number): Mat3 {
        const t = this.translate(tx, ty);
        const r = this.rotate(rot);
        const s = this.scale(sx, sy);
        return this.multiply(t, this.multiply(r, s));
    },
    transformPoint(m: Mat3, x: number, y: number): Point2D {
        return {
            x: m[0] * x + m[1] * y + m[2],
            y: m[3] * x + m[4] * y + m[5]
        };
    },
    invert(m: Mat3): Mat3 | null {
        const a = m[0], b = m[1], tx = m[2];
        const c = m[3], d = m[4], ty = m[5];
        const det = a * d - b * c;
        if (Math.abs(det) < EPS) return null;
        const invDet = 1.0 / det;
        return [
            d * invDet, -b * invDet, (b * ty - d * tx) * invDet,
            -c * invDet, a * invDet, (c * tx - a * ty) * invDet,
            0, 0, 1
        ];
    }
};