﻿/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_input.ts" />
/// <reference path="./wwa_camera.ts" />
/// <reference path="./wwa_picture.ts" />
/// <reference path="./wwa_main.ts" />

module wwa_cgmanager {
    import Consts = wwa_data.WWAConsts;
    import Position = wwa_data.Position;
    export class CGManager {
        protected _ctx: CanvasRenderingContext2D;
        protected _ctxSub: CanvasRenderingContext2D;
        protected _isLoaded: boolean = false;
        private _fileName: string;
        private _loadCompleteCallBack: () => void;
        private _image: HTMLImageElement;

        private _load(): void {

            if ( this._isLoaded) {
                return;
            }

            this._image = new Image();
            this._image.addEventListener("load", () => {
                this._loadCompleteCallBack();
            });
            this._image.addEventListener("error", () => {
                throw new Error("Image Load Failed!!\nfile name:" + this._fileName); 
            });
            this._image.src = this._fileName;
            this._isLoaded = true;
        }

        public getImage(): HTMLImageElement {
            return this._image;
        }
        
        public drawCanvas(chipX: number, chipY: number, canvasX: number, canvasY: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public drawCanvasWithSize(chipX: number, chipY: number, width: number, height: number, canvasX: number, canvasY: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height, canvasX, canvasY,
                Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height
           );
        }

        public drawCanvasWithUpperYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
            if ( delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public drawCanvasWithLowerYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, yLimit - canvasY);
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public clearCanvas(x: number, y: number, w: number, h: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.clearRect(x, y, w, h);
        }

        public drawBase(x: number, y: number, w: number, h: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.fillStyle = "#9E9E9E";
            ctx.fillRect(x, y, w, h);
        }



        public constructor(ctx: CanvasRenderingContext2D, ctxSub: CanvasRenderingContext2D, fileName: string, loadCompleteCallBack: () => void) {
            this._ctx = ctx;
            this._ctxSub = ctxSub;
            this._fileName = fileName;
            this._loadCompleteCallBack = loadCompleteCallBack;
            this._load();
        } 
    }

    export class PictureManager extends CGManager {

        public drawPictureData(picture: wwa_picture.Picture, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.save();
            if (picture.hasAngle) {
                let translateX = picture.pos.x + (picture.width / 2);
                let translateY = picture.pos.y + (picture.height / 2);
                ctx.translate(translateX, translateY);
                ctx.rotate(picture.angle);
                ctx.translate(-translateX, -translateY);
            }
            ctx.globalAlpha = picture.opacity;
            ctx.textAlign = picture.textAlign;
            ctx.textBaseline = picture.textBaseline;
            
            ctx.font = picture.font;
            ctx.fillStyle = picture.fillStyle;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            this.drawCanvasWithPicture(picture, isSub);
            ctx.restore();
        }

        public drawCanvasWithPicture(picture: wwa_picture.Picture, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            var posX = picture.isFill ? ( picture.pos.x % picture.chipSize.x ) - picture.chipSize.x : picture.pos.x;
            var posY = picture.isFill ? ( picture.pos.y % picture.chipSize.y ) - picture.chipSize.y : picture.pos.y;
            var beginX = posX;
            var beginY = posY;

            for (var y = 0; y < picture.repeat.y; y++) {
                for (var x = 0; x < picture.repeat.x; x++) {
                    ctx.drawImage(
                        this.getImage(), Consts.CHIP_SIZE * picture.imageCrop.x, Consts.CHIP_SIZE * picture.imageCrop.y,
                        Consts.CHIP_SIZE * picture.cropSize.x, Consts.CHIP_SIZE * picture.cropSize.y,
                        posX, posY,
                        picture.size.x * picture.cropSize.x, picture.size.y * picture.cropSize.y
                    );
                    posX += picture.chipSize.x;
                    posY += picture.shift.y;
                }
                beginY += picture.chipSize.y;
                posY = beginY;
                beginX += picture.shift.x;
                posX = beginX;
            }
            ctx.fillText(picture.text, picture.pos.x, picture.pos.y);
        }
        
        public constructor(ctx: CanvasRenderingContext2D, ctxSub: CanvasRenderingContext2D, fileName: string, loadCompleteCallBack: () => void) {
            super(ctx, ctxSub, fileName, loadCompleteCallBack);
        }
    }

}
