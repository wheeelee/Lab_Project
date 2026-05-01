import { Mat3, mat3 } from "./mat3";

export class Transform {
    x = 0;
    y = 0;
    rotation = 0;
    scaleX = 1;
    scaleY = 1;

    toMatrix(): Mat3 {
        return mat3.fromTransform(
            this.x,
            this.y,
            this.rotation,
            this.scaleX,
            this.scaleY
        );
    }
}