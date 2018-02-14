/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_main.ts" />

module wwa_picture {
    import Consts = wwa_data.WWAConsts;
    const PropertyTable: { [key: string]: (data: Picture, value: Array<string>) => void } = {
        "pos": (data, value) => {
            data.setProperty("pos", value);
        },
        "time": (data, value) => {
            data.setProperty("time", value);
        },
        "next": (data, value) => {
        },
        "size": (data, value) => {
            data.setProperty("size", value);
        },
        "clip": (data, value) => {
            data.setProperty("clip", value);
        },
        "angle": (data, value) => {
            data.setProperty("angle", value);
        },
        "repeat": (data, value) => {
            data.setProperty("repeat", value);
        },
        "fill": (data, value) => {
            var isFill = Util.getIntValue(value[0]);
            if (isFill == 1) {
                var fillValue = [Consts.FIELD_WIDTH.toString(), Consts.FIELD_HEIGHT.toString()];
                data.setProperty("repeat", fillValue);
            }
        },
        "opacity": (data, value) => {
            data.setProperty("opacity", value);
        },
        "text": (data, value) => {
            data.setProperty("text", value);
        },
        "text_var": (data, value) => {

        },
        "font": (data, value) => {
            data.setProperty("font", value);
        },
        "color": (data, value) => {
            data.setProperty("color", value);
        },
        "anim_straight": (data, value) => {
            data.setAnimation("anim_straight", "pos", value);
        },
        "anim_circle": (data, value) => {
            data.setAnimation("anim_circle", "pos", value);
        }
    };
    const AlignTable: Array<string> = [
        "start",
        "center",
        "end"
    ];
    const BaselineTable: Array<string> = [
        "top",
        "middle",
        "alphabetic",
        "bottom"
    ];
    export class PictureData {
        private _pictures: Array<Picture>;
        /** ピクチャを複数格納するクラスです。
         * @param size ピクチャが格納できる個数を指定します。
         */
        constructor(size: number) {
            this._pictures = new Array(size);
        }
        /**
         * 指定したIDがデータの範囲内か確認します。
         * @param id ID(0から指定)
         */
        public checkID(id: number): boolean {
            if (id < 0 || id >= this._pictures.length) {
                throw new Error("指定したIDが範囲外です。");
            }
            return true;
        }
        /**
         * 指定したIDのピクチャが空でないか確認します
         * @param id ID(0から指定)
         */
        public isEmpty(id: number): boolean {
            if (this._pictures[id] === void 0) {
                return true;
            }
            return false;
        }
        /**
         * ピクチャのデータにピクチャを指定します。
         * @param picture 作成するピクチャのインスタンス
         * @param id ID(0から指定)
         */
        public setPicture(picture: Picture, id: number): void {
            this.checkID(id);
            this._pictures[id] = picture;
        }
        /**
         * 指定したIDのピクチャを削除します。
         * @param id ID(0から指定)
         */
        public removePicture(id: number) {
            this._pictures[id] = void 0;
        }
        /**
         * 格納しているピクチャすべての動きを開始します。
         */
        public start(): void {
            this._pictures.forEach((picture, id) => {
                if (!this.isEmpty(id)) {
                    picture.start();
                }
            }, this);
        }
        /**
         * 指定したIDのピクチャの動きを開始します。
         * @param id (0から指定)
         */
        public startPicture(id: number): void {
            this.checkID(id);
            this._pictures[id].start();
        }
        /**
         * 格納しているピクチャすべての動きを止めます。
         */
        public stop() {
            this._pictures.forEach((picture, id) => {
                if (!this.isEmpty(id)) {
                    picture.stop();
                }
            }, this);
        }
        /**
         * 格納しているピクチャすべてを動かします。
         */
        public update(): void {
            this._pictures.forEach((picture, id) => {
                if (!this.isEmpty(id)) {
                    picture.update(picture);
                }
            });
        }
        /**
         * 指定したIDのピクチャを返します。
         * @param id ID(0から指定)
         */
        public getPicture(id: number): Picture {
            this.checkID(id);
            return this._pictures[id];
        }
    }
    export class Picture {
        public static isPrimaryAnimationTime: boolean = true;
        // 初期設定
        private _imageCrop: wwa_data.Coord;
        private _secondImageCrop: wwa_data.Coord;
        private _startTimer: wwa_data.Timer;
        private _soundNumber: number;
        public nextParts: number;
        private _properties: {
            "pos": Pos,
            "time": Time,
            "size": Size,
            "clip": Clip,
            "angle": Angle,
            "repeat": Repeat,
            "opacity": Opacity,
            "text": Text,
            "font": Font,
            "color": Color
        };
        private _anims: Array<Animation>;
        // 内部制御用
        private _isVisible: boolean;
        private _isTimeout: boolean;
        private _intervalID: number;

        /**
         * @param imgCropX イメージの参照先のX座標です。
         * @param imgCropY イメージの参照先のY座標です。
         * @param secondImgCropX イメージの第2参照先のX座標で、アニメーションが設定されている場合に使います。
         * @param secondImgCropY イメージの第2参照先のY座標で、アニメーションが設定されている場合に使います。
         * @param soundNumber サウンド番号です。0の場合は鳴りません。
         * @param waitTime 待ち時間です。10で1秒になります。
         * @param message ピクチャを表示するパーツのメッセージです。各行を配列にした形で設定します。
         */
        constructor(
        imgCropX: number, imgCropY: number,
        secondImgCropX: number, secondImgCropY: number,
        soundNumber: number, waitTime: number, message: Array<string>) {
            this._imageCrop = new wwa_data.Coord(imgCropX, imgCropY);
            this._secondImageCrop = new wwa_data.Coord(secondImgCropX, secondImgCropY);
            this._soundNumber = soundNumber;
            this._properties = {
                pos: new Pos(),
                time: new Time(() => {
                    this._isVisible = false;
                    this._isTimeout = true;
                }),
                size: new Size(),
                clip: new Clip(),
                angle: new Angle(),
                repeat: new Repeat(),
                opacity: new Opacity(),
                text: new Text(),
                font: new Font(),
                color: new Color()
            }
            this._anims = new Array();
            this._startTimer = new wwa_data.Timer(waitTime, false, () => {
                this._isVisible = true;
                if (this._properties.time !== void 0) {
                    this._properties.time.start();
                }
            });
            this._isVisible = waitTime <= 0;
            this._isTimeout = false;
            
            message.forEach((line, index) => {
                var property = this.createProperty(line);
                PropertyTable[property.type](this, property.value);
            }, this);
        }
        /** プロパティを表記した1行からプロパティを生成します。
         * @param line プロパティの表記をした1行を指定します。
         */
        public createProperty(line: string): {
            type: string,
            value: Array<string>
        } {
            var property = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)/);
            if (property === null || property.length !== 3) {
                throw new Error("プロパティではありません");
            }
            return {
                type: property[1],
                value: property[2].match(/"[^"]*"|[^,]+/g)
            };
        }
        /** 種類が決まったプロパティをピクチャに割り当てます。
         * @param type プロパティの種類名です。
         * @param value プロパティの内容を記述した配列です。
         */
        public setProperty(type: string, value: Array<string>) {
            this._properties[type].setProperty(value);
        }
        /**
         * 文字列からプロパティを取得します。
         * @param type プロパティのタイプ
         */
        public getProperty(type: string): Property {
            if (type in this._properties) {
                return this._properties[type];
            } else {
                throw new Error(`${type} のプロパティが見つかりません。`);
            }
        }
        public createAnimation(anim: Animation) {
            this._anims.push(anim);
        }
        public setAnimation(animationType: string, propertyType: string, value: Array<string>) {
            var animation = this._properties[propertyType].createAnimation(animationType);
            animation.setProperty(value);
            this._anims.push(animation);
        }
        /**
         * ピクチャを動かします。
         * @param self 動かすピクチャ (setInterval内でこのメソッドを指定した場合、thisの対象がwindowに移るため)
         */
        public update(self: Picture) {
            self._anims.forEach((anim) => {
                anim.update();
            }, self);
        }
        /**
         * メッセージ表示後にイメージ表示を行いたいので、タイマーの開始はコンストラクタに含めない
         */
        public start() {
            if (this.isVisible) {
                this._properties.time.start();
            } else {
                this._startTimer.start();
            }
            this._intervalID = setInterval(this.update, 10, this);
        }
        /**
         * ピクチャの動きを止めます。
         */
        public stop() {
            if (this.isVisible) {
                this._properties.time.stop();
            } else {
                this._startTimer.stop();
            }
            clearInterval(this._intervalID);
        }
        public getImageCrop(): wwa_data.Coord {
            if (this.hasSecondaryImage()) {
                return Picture.isPrimaryAnimationTime ? this._imageCrop : this._secondImageCrop;
            }
            return this._imageCrop;
        }
        public hasSecondaryImage(): boolean {
            return this._secondImageCrop.x != 0 || this._secondImageCrop.y != 0;
        }
        get isVisible(): boolean {
            return this._isVisible;
        }
        get isTimeout(): boolean {
            return this._isTimeout;
        }
        get soundNumber(): number {
            return this._soundNumber;
        }
        get nextPictureNumber(): number {
            return this._properties.time.nextPicture;
        }
        get width(): number {
            return this._properties.repeat.x * Consts.CHIP_SIZE;
        }
        get height(): number {
            return this._properties.repeat.y * Consts.CHIP_SIZE;
        }
        get pos(): wwa_data.Coord {
            return this._properties.pos;
        }
        get size(): wwa_data.Coord {
            return this._properties.size;
        }
        get cropSize(): wwa_data.Coord {
            return this._properties.clip;
        }
        get opacity(): number {
            return this._properties.opacity.value;
        }
        get angle(): number {
            return this._properties.angle.degree;
        }
        get repeat(): wwa_data.Coord {
            return this._properties.repeat;
        }
        get text(): string {
            return this._properties.text.str;
        }
        get textAlign(): string {
            return this._properties.text.align;
        }
        get textBaseline(): string {
            return this._properties.text.baseline;
        }
        get font(): string {
            return this._properties.font.font;
        }
        get fillStyle(): string {
            return this._properties.color.cssColorValue;
        }
    }
    /** プロパティ
     * ===
     * - Q. なんでコンストラクタではなくて専用の関数でプロパティをセットするの？
     *    - A. プロパティがセットされるかどうかは文字列で判定する都合上、全部がセットされるかどうかはわからないので！
     */
    export interface Property {
        setProperty(value: Array<string>);
        createAnimation(animationType: string): Animation;
    }
    interface Animation extends Property {
        update();
    }
    class Pos extends wwa_data.Coord implements Property {
        constructor() {
            super(0, 0);
        }
        public setProperty(value) {
            this.x = Util.getIntValue(value[0]);
            this.y = Util.getIntValue(value[1]);
        }
        public createAnimation(animationType) {
            if (animationType === "anim_straight") {
                return new StraightAnimation(this);
            }
            return null;
        }
    }
    class StraightAnimation extends Pos implements Animation {
        private _parent: Pos;
        constructor(parent: Pos) {
            super();
            this._parent = parent;
        }
        public update() {
            this._parent.x += this.x;
            this._parent.y += this.y;
        }
    }
    class Time extends wwa_data.Timer implements Property {
        private _isSet: boolean;
        private _nextPictureNumber: number;
        constructor(timeoutCallback: () => void = () => {}) {
            super(0, false, timeoutCallback);
            this._isSet = false;
            this._nextPictureNumber = 0;
        }
        public setProperty(value) {
            var time = Util.getIntValue(value[0]);
            if (time < 0) {
                throw new Error("タイマーの値が不正です。");
            }
            this.time = time;
            this._nextPictureNumber = Util.getIntValue(value[1], 0);
            this._isSet = true;
        }
        public createAnimation(animationType) {
            return null;
        }
        public start(): void {
            if (this._isSet) {
                super.start();
            }
        }
        public stop(): void {
            if (this._isSet) {
                super.stop();
            }
        }
        get nextPicture(): number {
            return this._nextPictureNumber;
        }
        get isSet(): boolean {
            return this._isSet;
        }
    }
    class Size extends wwa_data.Coord implements Property {
        constructor() {
            super(Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        }
        public setProperty(value) {
            this.x = Util.getIntValue(value[0]);
            this.y = Util.getIntValue(value[1]);
        }
        public createAnimation(animationType) {
            return new Zoom(this);
        }
    }
    class Zoom extends Size implements Animation {
        private _parent: Size;
        constructor(parent: Size) {
            super();
            this._parent = parent;
        }
        public update() {
            this._parent.x += this.x;
            this._parent.y += this.y;
        }
    }
    class Clip extends wwa_data.Coord implements Property {
        constructor() {
            super(1, 1);
        }
        public setProperty(value) {
            this.x = Util.getIntValue(value[0]);
            this.y = Util.getIntValue(value[1]);
        }
        public createAnimation(animationType) {
            return null;
        }
    }
    class Angle implements Property {
        private _degree: number;
        constructor() {
            this._degree = 0;
        }
        public setProperty(value) {
            var degree = Util.getIntValue(value[0]);
            degree = degree % 360;
            this._degree = degree;
        }
        public createAnimation(animationType) {
            return new Rotate(this);
        }
        get degree() {
            return this._degree;
        }
    }
    class Rotate extends Angle implements Animation {
        private _parent: Angle;
        private _interval: number;
        constructor(parent: Angle) {
            super();
            this._parent = parent;
        }
        public setProperty(value) {
            super.setProperty(value);
            var interval = Util.getIntValue(value[1]);
            this._interval = interval;
        }
        public update() {
        }
    }
    class Repeat extends wwa_data.Coord implements Property {
        constructor() {
            super(1, 1);
        }
        public setProperty(value) {
            this.x = Util.getIntValue(value[0]);
            this.y = Util.getIntValue(value[1]);
        }
        public createAnimation() {
            return null;
        }
    }
    class Opacity implements Property {
        private _value: number;
        constructor() {
            this._value = 1.0;
        }
        public setProperty(value) {
            var opacity = Util.getFloatValue(value[0]);
            if (opacity > 1.0) {
                throw new Error("透明度は 1.0 以下である必要があります。");
            } else if (opacity < 0) {
                throw new Error("透明度は 0 以上である必要があります。");
            }
            this._value = opacity;
        }
        public createAnimation() {
            return null;
        }
        get value() {
            return this._value;
        }
    }
    class Text implements Property {
        private _str: string;
        private _align: number;
        private _baseline: number;
        constructor() {
            this._str = "";
        }
        public setProperty(value) {
            this._str = Util.getStringValue(value[0]);
            this._align = Util.getIntValue(value[1], 0);
            this._baseline = Util.getIntValue(value[2], 0);
        }
        public createAnimation(animationType) {
            return null;
        }
        get str(): string {
            return this._str;
        }
        get align(): string {
            return AlignTable[this._align];
        }
        get baseline(): string {
            return BaselineTable[this._baseline];
        }
    }
    /**
     * フォントです。文字のサイズなどを指定しますが、 Text クラスとは別に取り扱っています。
     */
    class Font implements Property {
        private _size: number;
        private _weight: boolean;
        private _italic: boolean;
        private _family: string;
        static DEFAULT_SIZE = 16;
        static DEFAILT_FAMILY = "sans-serif";
        constructor() {
            this._size = Font.DEFAULT_SIZE;
            this._weight = false;
            this._italic = false;
            this._family = Font.DEFAILT_FAMILY;
        }
        public setProperty(value) {
            this._size = Util.getIntValue(value[0]);
            this._weight = Util.getBoolValue(value[1], false);
            this._italic = Util.getBoolValue(value[2], false);
            this._family = Util.getStringValue(value[3], Font.DEFAILT_FAMILY);
        }
        public createAnimation(animationType) {
            return null;
        }
        get font(): string {
            var weight = this._weight ? "bold" : "normal";
            var style = this._italic ? "italic" : "normal";
            return `${style} ${weight} ${this._size}px ${this._family}`;
        }
    }
    class Color extends wwa_data.Color implements Property {
        constructor() {
            super(0, 0, 0);
        }
        public setProperty(value) {
            this.red = Util.getIntValue(value[0]);
            this.green = Util.getIntValue(value[1]);
            this.blue = Util.getIntValue(value[2]);
        }
        public createAnimation(animationType) {
            return null;
        }
    }
    export class Util {
        public static getIntValue(str: string, fallback: number = void 0): number {
            var value = parseInt(str, 10);
            if (Util.checkFallbackNumber(value, fallback)) {
                return fallback;
            }
            return value;
        }
        public static getFloatValue(str: string, fallback: number = void 0): number {
            var value = parseFloat(str);
            if (Util.checkFallbackNumber(value, fallback)) {
                return fallback;
            }
            return value;
        }
        /**
         * フォールバック値も含めた数字を代入して、ちゃんとフォールバックできたか確認します。
         * フォールバックせず、本来の数字が存在する場合は false になります。
         * @param value 本来の数字
         * @param fallback フォールバック値
         */
        public static checkFallbackNumber(value: number, fallback: number): boolean {
            if (isNaN(value)) {
                if (fallback === void 0) {
                    throw new Error("値が正しく定義されていません。");
                }
                return true;
            }
            return false;
        }
        public static getBoolValue(str: string, fallback: boolean = void 0): boolean {
            var fallbackNumber = Util.parseIntFromBool(fallback);
            var value = Util.getIntValue(str, fallbackNumber);
            return Util.parseBool(value);
        }
        /**
         * 数字の値を引数に、bool値を返します
         * @param value 数字
         */
        public static parseBool(value: number): boolean {
            if (value) {
                return true;
            } else {
                return false;
            }
        }
        /**
         * boolの値を引数に、0か1かどちらかを返します
         * @param value bool値
         */
        public static parseIntFromBool(value: boolean): number {
            if (value) {
                return 1;
            } else {
                return 0;
            }
        }
        public static getStringValue(str: string, fallback: string = void 0): string {
            if (str === void 0) {
                if (fallback === void 0) {
                    throw new Error("値が正しく定義されていません。");
                }
                return fallback;
            }
            var trimmedStr = Util.trimString(str, '"');
            return trimmedStr;
        }
        /**
         * 文字列の両端の記号を切り取ります
         * @param str 切り取られる文字列(両端に対象の記号がないと正常に処理できません)
         * @param trimmingChar 切り取り対象の記号
         */
        public static trimString(str: string, trimmingChar: string): string {
            if (str.charAt(0) === trimmingChar && str.charAt(str.length - 1) === trimmingChar) {
                return str.slice(1, -1);
            } else {
                throw new Error("両端に切り取る記号がありません");
            }
        }
    }
}