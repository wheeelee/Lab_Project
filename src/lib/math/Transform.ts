import { Mat3, mat3 } from "./mat3";

export class Transform {
    x = 0;
    y = 0;

    rotation = 0;

    scaleX = 1;
    scaleY = 1;

    pivotX = 0;
    pivotY = 0;

    toMatrix(): Mat3 {
        const T = mat3.translate(this.x, this.y);

        const P = mat3.translate(
            this.pivotX,
            this.pivotY
        );

        const Pinv = mat3.translate(
            -this.pivotX,
            -this.pivotY
        );

        const R = mat3.rotate(this.rotation);

        const S = mat3.scale(
            this.scaleX,
            this.scaleY
        );

        return mat3.multiply(
            T,
            mat3.multiply(
                P,
                mat3.multiply(
                    R,
                    mat3.multiply(
                        S,
                        Pinv
                    )
                )
            )
        );
    }
}