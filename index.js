/* copyright 2020, stefano bovio @allyoucanmap. */

(function (o_o) {
    var document = o_o.document;
    function geCount(cells) {
        var count = 0;
        for (var i = 0; i < cells.length; i++) {
            if (cells[i] === null) {
                count++;
            }
        }
        return count;
    }
    function getImage(src, callback) {
        var image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = function () {
            var width = image.naturalWidth;
            var height = image.naturalHeight;
            var canvas = document.createElement('canvas');
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            var values = [];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var color = ctx.getImageData(x, y, 1, 1).data;
                    if (color[0] === 0 && color[1] === 0) {
                        values.push(null);
                    } else if (color[0] === 0 && color[1] === 255) {
                        var rnd = Math.floor(Math.random() * 10);
                        if (rnd < 5) {
                            values.push(null);
                        } else {
                            values.push(1);
                        }
                    } else {
                        values.push(1);
                    }
                }
            }
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    const loc = x + y * width;
                    if (values[loc]) {
                        // [0] [1] [2]
                        // [3] [ ] [5]
                        // [6] [7] [8]
                        const loc0 = (x - 1) + (y - 1) * width;
                        const loc1 = x + (y - 1) * width;
                        const loc2 = (x + 1) + (y - 1) * width;

                        const loc3 = (x - 1) + y * width;
                        const loc5 = (x + 1) + y * width;

                        const loc6 = (x - 1) + (y + 1) * width;
                        const loc7 = x + (y + 1) * width;
                        const loc8 = (x + 1) + (y + 1) * width;

                        var count = geCount([
                            values[loc0],
                            values[loc1],
                            values[loc2],

                            values[loc3],
                            values[loc5],

                            values[loc6],
                            values[loc7],
                            values[loc8]
                        ]);

                        values[loc] = count;
                    }
                }
            }
            callback(values, width, height);
        };
        image.src = src;
    }

    var container = document.querySelector('#container');

    var screen = document.createElement('div');
    screen.setAttribute('class', 'screen');
    container.appendChild(screen);

    var toolbar = document.createElement('div');
    toolbar.setAttribute('class', 'toolbar');
    screen.appendChild(toolbar);

    var minesCount = document.createElement('div');
    minesCount.setAttribute('class', 'mines');
    toolbar.appendChild(minesCount);

    var state = document.createElement('div');
    state.setAttribute('class', 'state');
    toolbar.appendChild(state);

    state.innerHTML = ':)';

    var time = document.createElement('div');
    time.setAttribute('class', 'time');
    toolbar.appendChild(time);

    time.innerHTML = '00:00';

    getImage('3857.png', function (values, width, height) {

        var mines = 0;

        for (var i = 0; i < values.length; i++) {
            if (values[i] === null) {
                mines++;
            }
        }

        var totalMines = mines;
        var visibleCovers = values.length;
        minesCount.innerHTML = mines;

        var namespaceURI = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(namespaceURI, 'svg');
        svg.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });

        var unit = 1;

        var cols = width / unit;
        var rows = height / unit;

        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        svg.style.position = 'relative';
        svg.style.width = '100%';
        svg.style.height = '100%';

        screen.appendChild(svg);

        var defs = document.createElementNS(namespaceURI, 'defs');
        svg.appendChild(defs);

        var flagSymbol = document.createElementNS(namespaceURI, 'symbol');
        flagSymbol.setAttribute('id', 'flag');
        flagSymbol.setAttribute('viewBox', '0 0 ' + unit + ' ' + unit);
        defs.appendChild(flagSymbol);

        var flagPath = document.createElementNS(namespaceURI, 'path');
        flagPath.setAttribute('d', 'M0.25 0.5 L0.75 0.5 L0.25 0.1 L0.25 0.9');
        flagPath.setAttribute('fill', '#ffaf27');
        flagPath.setAttribute('stroke', '#333333');
        flagPath.setAttribute('stroke-width', '0.05');

        flagSymbol.appendChild(flagPath);

        var page = document.createElementNS(namespaceURI, 'rect');
        page.setAttribute('x', 0);
        page.setAttribute('y', 0);
        page.setAttribute('width', width);
        page.setAttribute('height', height);
        page.setAttribute('fill', '#ffffff');
        svg.appendChild(page);

        var tiles = [];
        var startDate;
        var endDate;
        var gameOver = false;
        var timer;

        function pad(number) {
            if (number <= 9) {
                return '0' + number;
            }
            return number;
        }

        function surprise() {
            state.innerHTML = ':o';
            setTimeout(function () {
                if (!gameOver) {
                    state.innerHTML = ':)';
                }
            }, 500);
        }

        function stopGame() {
            gameOver = true;
            clearInterval(timer);
            endDate = Date.now();
            var flaggedMines = 0;
            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i].value === null) {
                    tiles[i].clear();
                    if (tiles[i].isFlagged()) {
                        flaggedMines++;
                    }
                }
            }
            var results = document.createElement('div');
            results.setAttribute('class', 'results');
            var resultsContent = document.createElement('div');
            resultsContent.setAttribute('class', 'results-content');
            var resultsText = '<div>GAME OVER</div>';
            if (visibleCovers === totalMines) {
                state.innerHTML = ':D';
                resultsText += '<div>MINES: ' + totalMines + ' / ' + totalMines + '</div>';
            } else {
                state.innerHTML = ':(';
                resultsText += '<div>MINES: ' + flaggedMines + ' / ' + totalMines + '</div>';
            }
            resultsText += '<div>FLAGS: ' + (totalMines - mines) + ' / ' + totalMines + '</div>';
            resultsText += '<div>TIME: ' + time.innerHTML + '</div>';
            resultsContent.innerHTML = resultsText;
            results.appendChild(resultsContent);
            screen.appendChild(results);
        }

        function checkGame() {
            if (visibleCovers === totalMines) {
                return stopGame();
            }
            return null;
        }

        function startTimer() {
            if (!startDate) {
                // time code from https://www.w3schools.com/howto/howto_js_countdown.asp
                startDate = Date.now();
                timer = setInterval(function () {
                    if (!gameOver) {
                        var now = Date.now();
                        var distance = now - startDate;
                        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                        if (hours > 0) {
                            time.innerHTML = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
                        } else {
                            time.innerHTML = pad(minutes) + ':' + pad(seconds);
                        }
                    }
                });
                // time code end
            }
        }

        var Cover = function (x, y) {
            var g = document.createElementNS(namespaceURI, 'g');
            var rect = document.createElementNS(namespaceURI, 'rect');
            rect.setAttribute('x', x * unit);
            rect.setAttribute('y', y * unit);
            rect.setAttribute('width', unit);
            rect.setAttribute('height', unit);
            rect.setAttribute('class', 'cover-tile');
            rect.setAttribute('stroke-width', 0.01);
            /* var flag = document.createElementNS(namespaceURI, 'g');
            flag.setAttribute('x', x * unit);
            flag.setAttribute('y', y * unit);*/


            var flag = document.createElementNS(namespaceURI, 'use');
            flag.setAttribute('x', x * unit);
            flag.setAttribute('y', y * unit);
            flag.setAttribute('width', unit);
            flag.setAttribute('height', unit);
            flag.setAttribute('href', '#flag');
            flag.style.pointerEvents = 'none';
            // flag.appendChild(useFlag);

            this.isFlagged = false;
            var _this = this;
            rect.addEventListener('contextmenu', function (event) {
                if (!gameOver && mines > 0) {
                    _this.isFlagged = !_this.isFlagged;
                    startTimer();
                    surprise();
                    if (flag.parentNode) {
                        flag.parentNode.removeChild(flag);
                    }
                    if (_this.isFlagged) {
                        g.appendChild(flag);
                        mines--;
                    } else {
                        mines++;
                    }
                    minesCount.innerHTML = mines;
                    checkGame();
                } else if (!gameOver && mines === 0 && _this.isFlagged) {
                    _this.isFlagged = false;
                    surprise();
                    if (flag.parentNode) {
                        flag.parentNode.removeChild(flag);
                    }
                    mines++;
                    minesCount.innerHTML = mines;
                    console.log('HERE');
                }
            });
            rect.addEventListener('click', function () {
                if (!gameOver && !_this.isFlagged) {
                    surprise();
                    startTimer();
                    _this.onclick('left');
                    checkGame();
                }
            });
            this.node = g;
            g.appendChild(rect);
            svg.appendChild(g);
        }

        var Mine = function (x, y, value) {
            var cover = new Cover(x, y);
            this.clear = function () {
                if (cover.node.parentNode) {
                    svg.removeChild(cover.node);
                }
                var circle = document.createElementNS(namespaceURI, 'circle');
                circle.setAttribute('cx', x * unit + unit / 2);
                circle.setAttribute('cy', y * unit + unit / 2);
                circle.setAttribute('r', unit * 0.6 / 2);
                if (cover.isFlagged) {
                    circle.setAttribute('stroke-width', '0.05');
                    circle.setAttribute('stroke', '#ffaf27');
                    circle.setAttribute('fill', '#333333');
                } else {
                    circle.setAttribute('fill', '#333333');
                }

                svg.appendChild(circle)
            }
            cover.onclick = function () {
                var red = document.createElementNS(namespaceURI, 'rect');
                red.setAttribute('x', x * unit);
                red.setAttribute('y', y * unit);
                red.setAttribute('width', unit);
                red.setAttribute('height', unit);
                red.setAttribute('fill', '#ff9999');
                svg.appendChild(red);
                stopGame();
            };
            this.value = value;
            this.isFlagged = function () {
                return cover.isFlagged;
            };
        };

        var colors = [
            '#ffffff',
            '#0000fd',
            '#028001',
            '#ff0000',
            '#020080',
            '#810201',
            '#027f80',
            '#000000',
            '#808080'
        ];

        function clearZero(x, y) {
            // [0] [1] [2]
            // [3] [ ] [5]
            // [6] [7] [8]
            const loc0 = (x - 1) + (y - 1) * cols;
            const loc1 = x + (y - 1) * cols;
            const loc2 = (x + 1) + (y - 1) * cols;

            const loc3 = (x - 1) + y * cols;
            const loc5 = (x + 1) + y * cols;

            const loc6 = (x - 1) + (y + 1) * cols;
            const loc7 = x + (y + 1) * cols;
            const loc8 = (x + 1) + (y + 1) * cols;

            const locations = [loc0, loc1, loc2, loc3, loc5, loc6, loc7, loc8];
            for (var i = 0; i < locations.length; i++) {
                var tile = tiles[locations[i]];
                if (tile && tile.value !== null) {
                    tile.clear();
                }
            }
        }

        var Tile = function (x, y, value) {
            var cover = new Cover(x, y);
            var _this = this;
            function addText() {
                var text = document.createElementNS(namespaceURI, 'text');
                text.setAttribute('x', x * unit + unit / 2);
                text.setAttribute('y', y * unit + unit / 2);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                text.setAttribute('font-size', unit * 0.9);
                text.setAttribute('font-family', 'monospace');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('class', 'number-tile');
                text.setAttribute('fill', colors[value]);
                text.innerHTML = value;
                return svg.appendChild(text);
            }

            cover.onclick = function () {
                if (!_this.removed) {
                    svg.removeChild(cover.node);
                    _this.removed = true;
                    visibleCovers--;
                    if (value === 0) {
                        return clearZero(x, y);
                    }
                    return addText();
                }
                return null;
            };
            this.clear = function () {
                if (!_this.removed && !cover.isFlagged) {
                    svg.removeChild(cover.node);
                    _this.removed = true;
                    visibleCovers--;
                    if (value === 0) {
                        return clearZero(x, y);
                    }
                    return addText();
                }
                return null;
            }
            this.value = value;
            this.isFlagged = function () {
                return cover.isFlagged;
            };
        };
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var loc = x + y * cols;
                if (values[loc] === null) {
                    tiles.push(new Mine(x, y, values[loc]));
                } else {
                    tiles.push(new Tile(x, y, values[loc]));
                }
            }
        }
    });
}({
    window: window,
    document: document
}));
