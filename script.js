/* jshint esversion: 6 */

// function setSpriteCoords(e) {
//     document.getElementById("spriteCoodrds").innerHTML = e.offsetX + ' ' + e.offsetY;
// }

const MAX_BOTS = 5;

function Game(ctx) {
    this.ctx = ctx;
    this.gameField = new GameField(ctx, 1000, 50);
    this.gameObjects = new GameObjects(ctx, 50);
    this.player = new Player(new Unit(500, 500, 0, 0, ctx, this.gameObjects, '#player'));
    this.gameObjects.push(this.player);
    this.bot = [];
    // this.bot[0] = new Bot(new Unit(100, 100, 0, 1, ctx, this.gameObjects, '#bot1'), this.player);
    // this.bot[1] = new Bot(new Unit(300, 100, 0, 1, ctx, this.gameObjects, '#bot2'), this.player);
    // this.bot[2] = new Bot(new Unit(600, 100, 0, 1, ctx, this.gameObjects, '#bot3'), this.player);
    // this.bot[3] = new Bot(new Unit(800, 100, 0, 1, ctx, this.gameObjects, '#bot4'), this.player);
    // for (let i = 0; i < 4; i++) {
    //     this.gameObjects.push(this.bot[i]);
    // }
    for (let i = 0; i < MAX_BOTS; i++) {
        let botUnit = new Bot(new Unit(Math.random() * 950, Math.random() * 950, 0, 1, ctx, this.gameObjects, '#bot' + i), this.player);
        let isIntersect = true;
        let num = 100;
        while (isIntersect && num--) {
            isIntersect = false;
            this.gameObjects.units().forEach(obj => {
                if (!isIntersect && Util.intersectObjects(botUnit.unit(), obj)) {
                    isIntersect = true;
                }
            });
            if (!isIntersect) {
                this.gameObjects.push(botUnit);
                this.bot[i] = botUnit;
                break;
            }
        }
    }
    for (let i = 0; i < 25; i++) {
        let wall = new Wall(new Unit(Math.random() * 950, Math.random() * 950, 0, 2, ctx, this.gameObjects, '#wall' + i));
        let isIntersect = false;
        this.gameObjects.units().forEach(obj => {
            if (!isIntersect && Util.intersectObjects(wall.unit(), obj)) {
                isIntersect = true;
            }
        });
        if (!isIntersect) {
            this.gameObjects.push(wall);
        }
    }

    this.started = false;
    this.paused = true;
    this.finished = false;
    this.start = () => { this.started = true; };
    this.pause = () => { this.paused = !this.paused; };
    this.finish = () => { this.finished = true; };
    return {
        gameField: () => this.gameField,
        gameObjects: () => this.gameObjects,
        player: () => this.player,
        addGameToBots: (game) => {
            for (let i = 0; i < MAX_BOTS; i++) {
                this.bot[i].addGame(game);
            }
        },
        start: this.start,
        pause: this.pause,
        finish: this.finish,
        isStarted: () => { return this.started },
        isPaused: () => { return this.paused; },
        isFinished: () => { return this.finished; },
        isRunning: () => { return this.started && !this.paused && !this.finished; },
        isStopped: () => { return this.started && this.paused && !this.finished; },
        isShowScore: () => { return this.started && this.finished; },
        keyPressed: (key) => {
            if (key == 'p') { this.pause(); }
            if (key == 'Enter') { this.start(); }
            if (key == 'f') { this.finish(); }
            if (['w', 'a', 's', 'd', ' '].includes(key)) {
                this.player.keyPressed(key);
            }
        },
        shoot: (x, y, dir, who) => {
            this.gameObjects.push(new Bullet(new Unit(x + 15, y + 15, dir, 3,
                this.ctx, this.gameObjects, '#bullet' + who + Math.random())));
        }
    }
}

function GameField(ctx, canvasWidth, objectWidth) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.objectWidth = objectWidth;
    this.objectsInRow = canvasWidth / objectWidth;
    return {
        draw: () => {
            this.ctx.fillStyle = '#eeeeff';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasWidth);
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#aaffaa';
            for (let i = 0; i <= this.objectsInRow; ++i) {
                this.ctx.moveTo(0, i * this.objectWidth);
                this.ctx.lineTo(this.canvasWidth, i * this.objectWidth);
                this.ctx.moveTo(i * this.objectWidth, 0);
                this.ctx.lineTo(i * this.objectWidth, this.canvasWidth);
            }
            this.ctx.stroke();
        }
    }
}

function GameObjects(ctx, objectWidth) {
    this.ctx = ctx;
    this.objectWidth = objectWidth;
    this.gameObjects = [];
    return {
        draw: () => {
            this.gameObjects.forEach(obj => obj.draw(this.ctx));
        },
        move: () => {
            this.gameObjects.forEach(obj => obj.move());
        },
        push: (gameObject) => {
            this.gameObjects.push(gameObject);
        },
        units: () => {
            return this.gameObjects.map(obj => obj.unit());
        },
        removeUuids: (uuids) => {
            this.gameObjects.forEach((obj, index) => {
                if (uuids.includes(obj.unit().uuid())) {
                    this.gameObjects.splice(index, 1);
                }
            })
        },
    }
}

class Dir {
    static dx = [1, 0, -1, 0];
    static dy = [0, 1, 0, -1];
}

function Unit(x, y, dir, num, ctx, gameObjects, uuid) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.num = num;
    this.ctx = ctx;
    this.gameObjects = gameObjects;
    this.uuid = uuid;
    return {
        draw: () => {
            Util.drawTank(this.x, this.y, this.dir, this.num, this.ctx);
        },
        dir: (t) => this.dir = t,
        xValue: () => this.x,
        yValue: () => this.y,
        dirValue: () => this.dir,
        toward: (unit) => {
            if (this.x + 25 < unit.xValue()) return 0;
            if (this.x - 25 > unit.xValue()) return 2;
            if (this.y + 25 < unit.yValue()) return 1;
            if (this.y - 25 > unit.yValue()) return 3;
            return Math.floor(Math.random()*4);
        },
        move: () => {
            var canMove = true;
            const koef = uuid.startsWith('#bullet') ? 5 : 1;
            this.x += koef*Dir.dx[this.dir];
            this.y += koef*Dir.dy[this.dir];
            let intersectUuid = "";
            this.gameObjects.units().forEach(unit => {
                if (Util.intersect(unit, this)) {
                    canMove = false;
                    intersectUuid = unit.uuid();
                }
            });
            if (!canMove) {
                this.x -= koef*Dir.dx[this.dir];
                this.y -= koef*Dir.dy[this.dir];
                if (this.uuid.startsWith("#bullet")) {
                    this.gameObjects.removeUuids([this.uuid, intersectUuid]);
                }
            }
        },
        uuid: () => this.uuid,
    }
}

function Player(unit) {
    this.unit = unit;
    this.hold = 0;
    this.holdShot = 0;
    return {
        addGame: (game) => {
            this.game = game;
        },
        draw: () => {
            this.unit.draw();
        },
        keyPressed: (key) => {
            if (['w','a','s','d'].includes(key)) {
                this.hold = 50;
                this.unit.dir(['d','s','a','w'].indexOf(key));
            };
            if (key === ' ') {
                if (!this.holdShot) {
                    this.game.shoot(this.unit.xValue(), this.unit.yValue(), this.unit.dirValue(), 'player');
                    this.holdShot = 50;
                }
            }
        },
        move: () => {
            if (this.hold > 0) {
                this.hold--;
                this.unit.move();
            }
            if (this.holdShot) {
                this.holdShot--;
            }
        },
        unit: () => this.unit
    }
}

function Bot(unit, player) {
    this.unit = unit;
    this.player = player;
    this.holdShot = 0;
    return {
        addGame: (game) => {
            this.game = game;
        },
        draw: () => {
            this.unit.draw();
        },
        move: () => {
            this.unit.dir(this.unit.toward(this.player.unit()));
            this.unit.move();
            if (!this.holdShot) {
                this.game.shoot(this.unit.xValue(), this.unit.yValue(), this.unit.dirValue(), 'bot');
                this.holdShot = 50;
            } else {
                this.holdShot--;
            }
        },
        unit: () => this.unit
    }
}

function Wall(unit) {
    this.unit = unit;
    return {
        draw: () => {
            this.unit.draw();
        },
        move: () => {
        },
        unit: () => this.unit
    }
}

function Bullet(unit) {
    this.unit = unit;
    return {
        draw: () => {
            this.unit.draw();
        },
        move: () => {
            this.unit.move();
        },
        unit: () => this.unit
    }
}

class Util {
    static sprites = new Image();
    static {
        this.sprites.src = "sprites.png";
    }
    static tankImgs = [
        [
            [
                [95, 1, 15, 15],
                [110, 1, 15, 15]
            ], [
                [65, 1, 15, 15],
                [80, 1, 15, 15]
            ], [
                [35, 1, 15, 15],
                [50, 1, 15, 15]
            ], [
                [0, 1, 15, 15],
                [15, 1, 15, 15]
            ]
        ],
        [
            [
                [130 + 95, 1, 15, 15],
                [130 + 110, 1, 15, 15]
            ], [
                [127 + 65, 1, 15, 15],
                [127 + 80, 1, 15, 15]
            ], [
                [127 + 35, 1, 15, 15],
                [127 + 50, 1, 15, 15]
            ], [
                [130 + 0, 1, 15, 15],
                [130 + 15, 1, 15, 15]
            ]
        ],
        [
            [
                [255 + 1, 1, 15, 15],
                [255 + 1, 1, 15, 15],
            ],
            [
                [260 + 1, 1, 15, 15],
                [260 + 1, 1, 15, 15],
            ],
            [
                [260 + 1, 1, 15, 15],
                [260 + 1, 1, 15, 15],
            ],
            [
                [260 + 1, 1, 15, 15],
                [260 + 1, 1, 15, 15],
            ],
        ],
        [
            [
                [345, 102, 5, 5],
                [345, 102, 5, 5],
            ],
            [
                [338, 102, 5, 5],
                [338, 102, 5, 5],
            ],
            [
                [330, 102, 5, 5],
                [330, 102, 5, 5],
            ],
            [
                [322, 102, 5, 5],
                [322, 102, 5, 5],
            ],
        ],
    ];
    
    static drawTank (x, y, t, num, ctx) {
        var z = (Math.floor(Date.now() / 300) % 2) > 0 ? 1 : 0;
        ctx.drawImage(
            this.sprites,
            this.tankImgs[num][t][z][0], this.tankImgs[num][t][z][1],
            this.tankImgs[num][t][z][2], this.tankImgs[num][t][z][3],
            x, y, this.tankImgs[num][t][z][2] * Math.floor(50 / 15), this.tankImgs[num][t][z][3] * Math.floor(50 / 15));
    }

    static intersect(unit1, unit2) {
        if ((unit1.uuid() === unit2.uuid)
            || (unit1.uuid() == '#player' && unit2.uuid.startsWith('#bulletplayer'))
            || (unit1.uuid().startsWith('#bulletplayer') && unit2.uuid.startsWith('#player'))
            || (unit1.uuid().startsWith('#bot') && unit2.uuid.startsWith('#bulletbot'))
            || (unit1.uuid().startsWith('#bulletbot') && unit2.uuid.startsWith('#bot'))
        ) return false;
        if (unit1.uuid().startsWith("#bullet") && unit2.uuid.startsWith("#bullet")) return false;
        return Math.sqrt((unit1.xValue() - unit2.x)**2 + (unit1.yValue() - unit2.y)**2) < (unit1.uuid().startsWith('#bulletplayer') ? 16 : 50);
    }

    static intersectObjects(unit1, unit2) {
        if ((unit1.uuid() === unit2.uuid())
            || (unit1.uuid() == '#player' && unit2.uuid().startsWith('#bulletplayer'))
            || (unit1.uuid().startsWith('#bulletplayer') && unit2.uuid().startsWith('#player'))
            || (unit1.uuid().startsWith('#bot') && unit2.uuid().startsWith('#bulletbot'))
            || (unit1.uuid().startsWith('#bulletbot') && unit2.uuid().startsWith('#bot'))
        ) return false;
        if (unit1.uuid().startsWith("#bullet") && unit2.uuid().startsWith("#bullet")) return false;
        return Math.sqrt((unit1.xValue() - unit2.xValue())**2 + (unit1.yValue() - unit2.yValue())**2) < (unit1.uuid().startsWith('#bulletplayer') ? 16 : 50);
    }
}

document.body.addEventListener('keydown', function(e) {
    game.keyPressed(e.key);
});

var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
canvas.width = 1000;
canvas.height = 1000;

var game = new Game(ctx);
game.player().addGame(game);
game.addGameToBots(game);

function animate(time) {
    if (game.isRunning()) { console.log('running'); }
    if (game.isStopped()) { console.log('paused'); }
    if (game.isShowScore()) { console.log('finished'); }

    game.gameField().draw();
    game.gameObjects().draw();
    game.gameObjects().move();

    requestAnimationFrame(animate);
}

animate();